from django.shortcuts import render , get_object_or_404
from .models import Post , Comment
from django.http import Http404
from django.core.paginator import Paginator
from django.views.generic import ListView
from .forms import EmailPostForm , CommentForm
from django.core.mail import send_mail
from django.views.decorators.http import require_POST
from taggit.models import Tag
from django.db.models import Count

from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import PostSerializer
from rest_framework import generics , viewsets


#region views

def post_list(request,tag_slug=None):

    posts = Post.published.all()
    paginator = Paginator(posts, 3)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    tag = None
    if tag_slug:
        tag = get_object_or_404(Tag,slug=tag_slug)
        posts=posts.filter(tags__in=[tag])

    return render(request,'weblog/post/list.html',
                  {'posts':page_obj , 'tag':tag})


def post_detail(request , year , month , day , post):
    post = get_object_or_404(Post,
                            status=Post.Status.PUBLISHED, 
                            slug=post,
                            publish__year=year,
                            publish__month=month,
                            publish__day=day)
    comments = post.comments.filter(active=True)
    form = CommentForm()

    post_tags_ids = post.tags.values_list('id',flat=True)
    similar_posts = Post.published.filter(tags__in=post_tags_ids)\
                                                .exclude(id=post.id)
    similar_posts = similar_posts.annotate(same_tags=Count('tags'))\
                                                .order_by('-same_tags','-publish')[:4]

    

    return render(request,
    'weblog/post/detail.html',
                  {'post': post , 'comments':comments , 'form':form , 'similar_posts':similar_posts})


class PostListView(ListView):
    queryset = Post.published.all()
    paginate_by=3
    template_name='weblog/post/list.html'


def post_share (request , post_id):
    post = get_object_or_404(Post,id=post_id,status=Post.Status.PUBLISHED)
    sent = False
    if request.method =='POST':
        form = EmailPostForm(request.POST)
        if form.is_valid():
            cd = form.cleaned_data
            post_url = request.build_absolute_uri(post.get_absolute_url())
            subject = f"{cd['name']} recomends u read" \
                f"{post.title}"
            message = f"Read {post.title} at {post_url}\n \n" \
                f"{cd['name']}\'s comment : {cd['comments']}"
            send_mail(subject , message , 'a.rezvandar@gmail.com',[cd['to']])
            sent = True

            

    else:
        form = EmailPostForm()
    return render(request,'weblog/post/share.html'
                  ,{'post':post, 'form':form , 'sent':sent})



@require_POST
def post_comment (request, post_id):
    post = get_object_or_404(Post , id = post_id , status = Post.Status.PUBLISHED)
    comment = None

    form = CommentForm(data=request.POST)
    if form.is_valid():
        comment=form.save(commit=False)
        comment.post = post
        comment.save()
    return render(request , 'weblog/post/comment.html',
                  {'post':post, 'form':form,'comment':comment})
 

#endregion


#region api 


@api_view(['GET','POST'])
def post_list_api(request):
    posts = Post.objects.all()
    serializer = PostSerializer(posts, many=True)
    return Response(serializer.data)


class PostListAPIView(generics.ListAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer


class PostViewsetAPIView(viewsets.ModelViewSet):
    queryset = Post.objects.order_by("id").all()
    serializer_class = PostSerializer

    
#endregion
