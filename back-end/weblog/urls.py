from django.urls import path , include
from . import views
from .feeds import LatestPostsFeed
from .views import PostListAPIView
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('',views.PostViewsetAPIView)


app_name = 'weblog'
urlpatterns = [
    # path('',views.post_list,name='post_list'),
    path('',views.PostListView.as_view(), name='post_list'),
    path('tag/<slug:tag_slug>/',views.post_list,name='post_list_by_tag'),
    path('<int:year>/<int:month>/<int:day>/<slug:post>/',views.post_detail,name='post_detail'),
    path('<int:post_id>/share/',views.post_share , name='post_share'),
    path('<int:post_id>/comment/',views.post_comment,name='post_comment'),
    path('feed', LatestPostsFeed(),name='post_feed'),


    
    # path('api/posts/', PostListAPIView.as_view(), name='post-list'),
    # path('api_function',views.post_list_api,name='post_list_api'),
    path('viewset/',include(router.urls)),
    
]
