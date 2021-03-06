from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework import status
from nose.tools import assert_equals


class LogoutTest(TestCase):
    def setUp(self):
        self.client = Client()

    def test_unauthenticated_user_cannot_logout(self):
        response = self.client.get('/auth/logout')
        assert_equals(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_logout(self):
        user = User.objects.create_user('username', 'test@test.com', 'password')
        user.save()

        token = Token.objects.get(user=user)
        response_get = self.client.get('/auth/logout', HTTP_AUTHORIZATION='Token ' + token.key)
        response_post = self.client.post('/auth/logout', HTTP_AUTHORIZATION='Token ' + token.key)

        assert_equals(response_get.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        assert_equals(response_post.status_code, status.HTTP_200_OK)
