require('dotenv').config();
const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require("axios");
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

const app = express();

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(3000, () => {
    console.log('app listening on port 3000!');
});

bot.onText(/\/recommend (.+)/, async (msg, match) => {
  const query = match[1];

  try {
    const books = await getBookRecommendations(query);
    if (books.length > 0) {
      const response = books.map((book, index) => `${index + 1}. "${book.title}" by ${book.authors.join(', ')}`).join('\n');
      await bot.sendMessage(msg.chat.id, response);
    } else {
      await bot.sendMessage(msg.chat.id, 'No recommendations found.');
    }
  } catch (error) {
    console.error('Error fetching book recommendations:', error);
    await bot.sendMessage(msg.chat.id, 'An error occurred while fetching book recommendations.');
  }

});

async function getBookRecommendations(query) {
  const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`;
  const response = await axios.get(apiUrl);
  const books = response.data.items.map(item => ({
    title: item.volumeInfo.title,
    authors: item.volumeInfo.authors || ['Unknown Author']
  }));
  return books;
}

bot.onText(/\/book (.+)/, async (msg, match) => {
  const query = match[1];
  try {
    const book = await getBook(query);
    if (book) {
      const response = `
                Title: ${book.title}
                Author(s): ${book.authors.join(', ')}
                Publisher: ${book.publisher}
                Published Date: ${book.publishedDate}
                Description: ${book.description}
                Preview Link: ${book.previewLink}
            `;
      await bot.sendMessage(msg.chat.id, response);
    } else {
      await bot.sendMessage(msg.chat.id, 'No book found with that title.');
    }
  } catch (error) {
    console.error('Error fetching book information:', error);
    await bot.sendMessage(msg.chat.id, 'An error occurred while fetching book information.');
  }
});

async function getBook(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=1`;
    const response = await axios.get(apiUrl);
    if (response.data.totalItems > 0) {
      const bookData = response.data.items[0].volumeInfo;
      const book = {
        title: bookData.title || '*Unknown Title*',
        authors: bookData.authors || '*Unknown Author*',
        publisher: bookData.publisher || '*Unknown Publisher*',
        publishedDate: bookData.publishedDate || '*Unknown Date*',
        description: bookData.description || '*No description available*',
        previewLink: bookData.previewLink || '*No preview available*'
      };
      return book;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching book information:', error);
    return null;
  }
}
