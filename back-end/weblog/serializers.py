from taggit.serializers import TagListSerializerField, TaggitSerializer
from rest_framework import serializers
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    tags = TagListSerializerField()
    class Meta:
        model = Post
        fields = '__all__'
