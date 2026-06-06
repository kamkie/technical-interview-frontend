import type { BookPage, Category } from '../../api/catalog'

export const javaCategory: Category = {
  id: 1,
  name: 'Java',
}

export const architectureCategory: Category = {
  id: 2,
  name: 'Architecture',
}

export const designCategory: Category = {
  id: 3,
  name: 'Design',
}

export const catalogCategories: Category[] = [
  javaCategory,
  architectureCategory,
  designCategory,
]

export const populatedBookPage: BookPage = {
  content: [
    {
      id: 1,
      title: 'Effective Java',
      author: 'Joshua Bloch',
      isbn: '9780134685991',
      publicationYear: 2018,
      categories: [javaCategory],
    },
    {
      id: 2,
      title: 'Clean Architecture',
      author: 'Robert C. Martin',
      isbn: '9780134494166',
      publicationYear: 2017,
      categories: [architectureCategory],
    },
  ],
  first: true,
  last: true,
  number: 0,
  numberOfElements: 2,
  size: 10,
  totalElements: 2,
  totalPages: 1,
}

export const filteredBookPage: BookPage = {
  content: [
    {
      id: 3,
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      publicationYear: 2008,
      categories: [javaCategory, designCategory],
    },
  ],
  first: true,
  last: true,
  number: 0,
  numberOfElements: 1,
  size: 10,
  totalElements: 1,
  totalPages: 1,
}

export const emptyBookPage: BookPage = {
  content: [],
  first: true,
  last: true,
  number: 0,
  numberOfElements: 0,
  size: 10,
  totalElements: 0,
  totalPages: 0,
}

export const paginatedBookPage: BookPage = {
  content: [
    {
      id: 4,
      title: 'Refactoring',
      author: 'Martin Fowler',
      isbn: '9780134757599',
      publicationYear: 2018,
      categories: [designCategory],
    },
  ],
  first: true,
  last: false,
  number: 0,
  numberOfElements: 1,
  size: 10,
  totalElements: 21,
  totalPages: 3,
}
