
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views
from .api import (
    CommentViewSet,
    post_share_api,
    latest_posts_api,
    post_similar_api,
    most_commented_api,
    stats_api,
)
from .feeds import LatestPostsFeed

router = DefaultRouter()
router.register('posts', views.PostViewsetAPIView, basename='posts')
router.register('comments', CommentViewSet, basename='comments')

app_name = 'weblog'
urlpatterns = [
    path('', views.PostListView.as_view(), name='post_list'),
    path('tag/<slug:tag_slug>/', views.post_list, name='post_list_by_tag'),
    path('<int:year>/<int:month>/<int:day>/<slug:post>/', views.post_detail, name='post_detail'),
    path('<int:post_id>/share/', views.post_share, name='post_share'),
    path('<int:post_id>/comment/', views.post_comment, name='post_comment'),
    path('feed/', LatestPostsFeed(), name='post_feed'),

    path('viewset/', include(router.urls)),

    path('api/share/', post_share_api, name='post_share_api'),
    path('api/latest/', latest_posts_api, name='latest_posts_api'),
    path('api/similar/<int:post_id>/', post_similar_api, name='post_similar_api'),
    path('api/most_commented/', most_commented_api, name='most_commented_api'),
    path('api/stats/', stats_api, name='stats_api'),
]
