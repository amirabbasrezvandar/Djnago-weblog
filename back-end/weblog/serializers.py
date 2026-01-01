from taggit.serializers import TagListSerializerField, TaggitSerializer
from rest_framework import serializers
from .models import Post, Comment


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'post', 'name', 'email', 'body', 'created', 'active']
        read_only_fields = ['id', 'created', 'active']


class PostSerializer(TaggitSerializer, serializers.ModelSerializer):
    tags = TagListSerializerField()
    class Meta:
        model = Post
        fields = '__all__'
