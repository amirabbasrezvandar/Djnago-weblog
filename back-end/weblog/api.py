from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.authentication import SessionAuthentication
from django.core.mail import send_mail
from django.shortcuts import get_object_or_404
from django.db.models import Count

from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer
from .forms import EmailPostForm


class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return 


class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.order_by('created')
    serializer_class = CommentSerializer
    permission_classes = [AllowAny]
    authentication_classes = (CsrfExemptSessionAuthentication,)

    def get_queryset(self):
        qs = super().get_queryset().filter(active=True)
        post_id = self.request.query_params.get('post')
        if post_id:
            qs = qs.filter(post_id=post_id)
        return qs

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(active=True)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


@api_view(['POST'])
def post_share_api(request):
    form = EmailPostForm(request.data)
    if not form.is_valid():
        return Response({'sent': False, 'errors': form.errors}, status=status.HTTP_400_BAD_REQUEST)

    cd = form.cleaned_data
    post_id = request.data.get('post_id')
    if not post_id:
        return Response({'sent': False, 'errors': 'post_id missing'}, status=status.HTTP_400_BAD_REQUEST)

    post = get_object_or_404(Post, id=post_id, status=Post.Status.PUBLISHED)
    post_url = request.build_absolute_uri(post.get_absolute_url())
    subject = f"{cd['name']} recommends you read {post.title}"
    message = f"Read {post.title} at {post_url}\n\n{cd.get('comments','')}"
    try:
        send_mail(subject, message, cd['email'], [cd['to']])
        return Response({'sent': True})
    except Exception as e:
        return Response({'sent': False, 'errors': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def latest_posts_api(request):
    posts = Post.objects.filter(status=Post.Status.PUBLISHED).order_by('-publish')[:5]
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def post_similar_api(request, post_id):
    post = get_object_or_404(Post, id=post_id, status=Post.Status.PUBLISHED)
    tag_ids = post.tags.values_list('id', flat=True)
    similar = (Post.objects.filter(status=Post.Status.PUBLISHED, tags__in=tag_ids)
               .exclude(id=post.id)
               .annotate(same_tags=Count('tags'))
               .order_by('-same_tags', '-publish')[:4])
    serializer = PostSerializer(similar, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def most_commented_api(request):
    posts = (Post.objects.filter(status=Post.Status.PUBLISHED)
             .annotate(comment_count=Count('comments'))
             .order_by('-comment_count')[:5])
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def stats_api(request):
    total = Post.objects.filter(status=Post.Status.PUBLISHED).count()
    latest = Post.objects.filter(status=Post.Status.PUBLISHED).order_by('-publish')[:5]
    most_commented = (Post.objects.filter(status=Post.Status.PUBLISHED)
                      .annotate(comment_count=Count('comments'))
                      .order_by('-comment_count')[:5])
    return Response({
        'post_count': total,
        'rss_feed': request.build_absolute_uri('/weblog/feed/'),
        'latest_posts': PostSerializer(latest, many=True).data,
        'most_commented_posts': PostSerializer(most_commented, many=True).data,
    })
