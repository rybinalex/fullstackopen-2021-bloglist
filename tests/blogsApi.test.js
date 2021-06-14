const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const Blog = require('../models/blog')

const api = supertest(app)

const initialBlogs = [
    {
        title: 'Ich hasse Kinder',
        author: 'Till Lindemann',
        url: 'https://music.apple.com/ru/album/ich-hasse-kinder/1568745133?i=1568745135&l=en',
        likes: 1000,
    },
    {
        title: 'Blessed Be',
        author: 'Spiritbox',
        url: 'https://music.apple.com/ru/album/blessed-be/1548317560?i=1548317561&l=en',
        likes: 999,
    }
]

beforeEach(async () => {
    await Blog.deleteMany({})

    const blogObjects = initialBlogs.map(blog => new Blog(blog))
    const promiseArray = blogObjects.map(blog => blog.save())
    await Promise.all(promiseArray)
})

test('blogs are returned as json', async () => {
    const response = await api.get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)

    expect(response.body).toHaveLength(initialBlogs.length)
})

test('blogs have id property', async () => {
    const response = await api.get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)

    expect(response.body[0].id).toBeDefined()
})

test('blogs added when sent by post request', async () => {
    const newBlog = {
        title: 'We Are The People',
        author: 'Empire of the Sun',
        url: 'https://music.apple.com/ru/album/we-are-the-people/712862605?i=712862710&l=en',
        likes: 998,
    }

    await api.post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')

    expect(response.body).toHaveLength(initialBlogs.length + 1)
    expect(response.body[2].title).toBe('We Are The People')
    expect(response.body[2].author).toBe('Empire of the Sun')
    expect(response.body[2].url).toBe('https://music.apple.com/ru/album/we-are-the-people/712862605?i=712862710&l=en')
    expect(response.body[2].likes).toBe(998)
})

test('likes set to zero if not specified', async () => {
    const newBlog = {
        title: 'Shooting Stars',
        author: 'Bag Raiders',
        url: 'https://music.apple.com/ru/album/shooting-stars/1440810476?i=1440810921&l=en',
    }

    await api.post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

    const response = await api.get('/api/blogs')

    expect(response.body[2].likes).toBe(0)
})

test('returns error 400 when title or author is missing', async () => {
    const newBlog = {
        url: 'https://music.apple.com/ru/album/one/1440666225?i=1440666375&l=en',
        likes: 997,
    }

    await api.post('/api/blogs')
        .send(newBlog)
        .expect(400)
})

test('deletes object on delete request', async () => {
    const blog = await Blog.findOne({author: 'Till Lindemann'})
    console.log(blog)

    await api.delete(`/api/blogs/${blog._id}`)
        .send()
        .expect(204)

    const blogAfterDeletion = await Blog.findOne({author: 'Till Lindemann'})

    expect(blogAfterDeletion).toBeNull()
})

afterAll(() => {
    mongoose.connection.close()
})
