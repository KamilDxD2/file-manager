# File Manager

A web file manager written in Node.js with Express and Handlebars. (School project)

## What it does

- **Users:** register and log in, the login is kept in a cookie for an hour.
- **File manager:** browse folders inside `PLIKI/`, create folders and files (new `.html`, `.css`, `.js`, `.json`, `.xml` and `.txt` files start with a small template), rename and delete them, upload files to the current folder.
- **Text editor:** opens text files with line numbers, change the font size and colors (the server remembers the settings), save the file.
- **Image editor:** preview grayscale, invert and sepia filters, apply one, save the image back and rename it.

## Stack

Node.js, Express, `express-handlebars` (server-side rendered views), `formidable`, `cookie-parser`, `nocache`.

## Running it

```
npm install
npm start
```

The server listens on `http://localhost:3000`.


## Known limitations

Note: This is a school project, kept close to how it was submitted.

- No database, users are kept in memory with plain-text passwords
- UI is not very intuitive
- Lots of repeated code
