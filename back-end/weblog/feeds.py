from django.db.models.base import Model
import markdown
from django.contrib.syndication.views import Feed
from django.template.defaultfilters import truncatewords_html
from django.urls import reverse_lazy
from .models import Post

class LatestPostsFeed(Feed):
    title = 'my weblog'
    link = reverse_lazy('weblog:post_list')
    description = 'New posts of my weblog'

    def items(self):
        return Post.published.all()[:5]
    
    def item_title(self , item):
        return item.title
    
    def item_description(self, item):
        return truncatewords_html(markdown.markdown(item.body), 30)
    
    def item_pubdate(self , item):
        return item.publish
    
    