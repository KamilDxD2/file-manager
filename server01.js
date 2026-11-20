const express = require("express")
const app = express()
const PORT = 3000;
const path = require("path")
const hbs = require('express-handlebars');
const formidable = require('formidable');
const fs = require('fs');
const cookieparser = require("cookie-parser");
const nocache = require("nocache");
app.use(nocache())
app.use(cookieparser())
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

let currentFolder = "";
let currentFile = "";
let re = /(?:\.([^.]+))?$/;

function getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
}

let txtD = 'txt\na\nb\nc\nd'
let cssD = 'body {\n    background-color: red;\n}'
let htmlD = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta http-equiv="X-UA-Compatible" content="IE=edge">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Document</title>\n</head>\n\n<body>\n    <h1>html file</h1>\n</body>\n\n</html>\n'
let jsD = '<script>\nconsole.log("js")\n<script>'
let jsonD = '{\n    "a": 1,\n   "b": 2,\n   "c": 3,\n}'
let xmlD = '<?xml version="1.0" encoding="UTF-8"?>\n<note> \n<to>Anna</to>\n <from>Jan</from>\n <body>mail body</body> \n</note>'

let Font_color = {
    Font: 1,
    Color: "purple"
}

const effects = [
    { name: "grayscale" },
    { name: "invert" },
    { name: "sepia" }
]

const Cookie_Check = (req, res) => {
    console.log(req.cookies.login)
    if (!req.cookies.login) {
        res.redirect("/login");
        return false
    }
    else {
        const user = Users.find((u) => u.login === req.cookies.login);
        if (!user) {
            res.redirect("/login");
            return false
        }
    }
    return true
}

let Users = []

const helpers = {
    PONE: function (i) {
        return i + 1;
    },
    EXT: function (name) {
        let ext = (re.exec(name)[1] || '').toLowerCase()
        if (ext === 'jpeg') ext = 'jpg'
        if (ext !== 'jpg' && ext !== 'png' && ext !== 'pdf' && ext !== 'txt' && ext !== 'html' && ext !== 'css' && ext !== 'xml') {
            return 'file'
        }
        else {
            return ext
        }
    },
    PTH: function (path) {
        const segments = path.split('/');
        return segments[segments.length - 1];
    },
    IMG: function (ext) {
        if (ext === 'jpg' || ext === 'png') {
            return true
        }
        else {
            return false
        }

    },

    LST: function (path) {
        let lastItem = path.substring(path.indexOf('PLIKI', __dirname.length) + 5).replace(/\\/g, '/')
        console.log(lastItem)
        return lastItem
    }
};

app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'main.hbs',
    helpers: helpers
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

let TAB = []
let idCounter = 0;

app.post('/Upload', function (req, res) {
    if (!Cookie_Check(req, res)) return
    let form = formidable({});
    form.uploadDir = __dirname + '/upload' // folder do zapisu zdjęcia
    form.keepExtensions = true // zapis z rozszerzeniem pliku
    form.multiples = true

    form.parse(req, function (err, fields, files) {
        let filePath = files.imageupload.path;
        if (filePath !== undefined) {
            fs.stat(filePath, function (err, stats) {
                if (err) {
                    console.error('Error getting file stats:', err);
                    res.status(500).send('Error getting file stats');
                    return;
                }

                let m_obj = {
                    id: idCounter++,
                    message: "file uploaded!",
                    data: {
                        path: files.imageupload.path,
                        name: files.imageupload.name,
                        size: files.imageupload.size,
                        date: stats.mtimeMs,
                        type: files.imageupload.type,
                    }
                }
                TAB.push(m_obj)
                res.redirect('/')

            })
        }
        else {
            files.imageupload.forEach(File => {
                let filePath = File.path
                fs.stat(filePath, function (err, stats) {
                    if (err) {
                        console.error('Error getting file stats:', err);
                        res.status(500).send('Error getting file stats');
                        return;
                    }

                    let m_obj = {
                        id: idCounter++,
                        message: "file uploaded!",
                        data: {
                            path: File.path,
                            name: File.name,
                            size: File.size,
                            date: stats.mtimeMs,
                            type: File.type,
                        }
                    }
                    TAB.push(m_obj)

                })
            });
            res.redirect('/')
        }
    });

});



app.get('/FileManager', function (req, res) {
    if (!Cookie_Check(req, res)) return
    res.render('filemanager.hbs', { TAB: TAB });
});


app.get('/FileManager2/*', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const FolderName = req.params[0];
    const filepath = path.join(__dirname, FolderName)
    let formatedPath = FolderName.split('/')
    formatedPath.shift();

    currentFolder = FolderName;

    let PATHF = '';
    let PATH = [];

    formatedPath.forEach((folder, index) => {
        PATHF += folder;
        PATH.push(PATHF);
        if (index !== formatedPath.length - 1) {
            PATHF += '/';
        }
    });

    const obj = {
        folders: [],
        files: [],
        PATH: PATH,
        PATHF: PATHF,
        user: req.cookies.login
    }

    fs.readdir(filepath, (err, files) => {
        if (err) {
            res.status(404).render('error.hbs', { error: "Folder not found" });
            return;
        }
        files.forEach((file) => {
            let stats = fs.lstatSync(path.join(filepath, file))
            if (stats.isDirectory()) {
                obj.folders.push({ file: file, path: FolderName + "/" + file })
            } else {
                obj.files.push(file)
            }
            //console.log(obj)

        })

        res.render('filemanager2.hbs', { data: obj });

    })
});

app.post('/UPL', function (req, res) {
    if (!Cookie_Check(req, res)) return
    let form = formidable({});
    form.uploadDir = currentFolder
    form.keepExtensions = true
    form.multiples = true

    const currentFolderPath = path.join(__dirname, currentFolder);
    let segments = currentFolderPath.split(path.sep);
    let index = segments.indexOf('PLIKI');
    let newPath;
    if (index !== -1) {
        newPath = segments.slice(index + 1).join('/');
    } else {
        console.log('PLIKI not found in path');
    }


    form.parse(req, function (_, fields, files) {
        let uploadedFiles = Array.isArray(files.fobj) ? files.fobj : [files.fobj];
        uploadedFiles.forEach((file) => {
            let filePath = file.path;
            if (filePath !== undefined) {
                let originalName = file.name;
                let newFilePath = path.join(form.uploadDir, originalName);
                fs.renameSync(filePath, newFilePath);
            } else {
                file.forEach((uploadedFile) => {
                    let originalName = uploadedFile.name;
                    let newFilePath = path.join(form.uploadDir, originalName);
                    fs.renameSync(uploadedFile.path, newFilePath);
                });
            }
        });
        if (newPath) {
            res.redirect(`/FileManager2/PLIKI/${newPath}`);
        }
        else {
            res.redirect(`/FileManager2/PLIKI`);
        }

    });
});


app.get('/Rename', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const NewName = req.query.Rename;
    const currentFolderPath = path.join(__dirname, currentFolder);
    const MODcfp = path.dirname(currentFolderPath);
    const newFolderPath = path.join(MODcfp, NewName);

    let segments = newFolderPath.split(path.sep);
    let index = segments.indexOf('PLIKI');
    let newPath;
    if (index !== -1) {
        newPath = segments.slice(index + 1).join('/');
    } else {
        console.log('PLIKI not found in path');
    }

    console.log(currentFolderPath, newFolderPath)
    if (!fs.existsSync(newFolderPath)) {
        fs.rename(currentFolderPath, newFolderPath, (err) => {
            if (err) {
                console.error('Error renaming folder:', err);
                res.status(500).send('Error renaming folder');
                return;
            }
            res.redirect(`/FileManager2/PLIKI/${newPath}`);
        });
    } else {
        console.error('Destination folder already exists');
        res.status(500).send('Destination folder already exists');
    }
});

app.get('/RenameF', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const NewName = req.query.Rename;
    const currentFilePath = currentFile
    const MODcfp = path.dirname(currentFilePath);
    const newFilePath = path.join(MODcfp, NewName);
    console.log("OBECNA ŚCIESZKA DO PLIKU: ", currentFilePath)
    console.log("NOWA ŚCIESZKA DO PLIKU: ", newFilePath)


    if (!fs.existsSync(newFilePath)) {
        fs.rename(currentFilePath, newFilePath, (err) => {
            if (err) {
                console.error('Error renaming file:', err);
                res.status(500).send('Error renaming file');
                return;
            }
            res.redirect(`/Edytor/${NewName}`);
        });
    } else {
        console.error('Destination file already exists');
        res.status(500).send('Destination file already exists');
    }
});

app.get('/RenameI', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const NewName = req.query.Rename;
    const currentFilePath = currentFile
    const MODcfp = path.dirname(currentFilePath);
    const newFilePath = path.join(MODcfp, NewName);
    console.log("OBECNA ŚCIESZKA DO PLIKU: ", currentFilePath)
    console.log("NOWA ŚCIESZKA DO PLIKU: ", newFilePath)


    if (!fs.existsSync(newFilePath)) {
        fs.rename(currentFilePath, newFilePath, (err) => {
            if (err) {
                console.error('Error renaming file:', err);
                res.status(500).send('Error renaming file');
                return;
            }
            res.redirect(`/Image/${NewName}`);
        });
    } else {
        console.error('Destination file already exists');
        res.status(500).send('Destination file already exists');
    }
});

app.post('/Saveimg', function (req, res) {
    if (!Cookie_Check(req, res)) return
    let dataURL = req.body.dataUrl;
    let path = req.body.path;
    let base64Data = dataURL.substring(23);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(path, buffer);
    res.json({ status: "ok" });

})


app.get('/Edytor/:filename', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const file = req.params.filename
    const currentFilePath = path.join(__dirname, currentFolder);
    const newFilePath = path.join(currentFilePath, file);

    currentFile = newFilePath;

    let segments = currentFilePath.split(path.sep);
    let index = segments.indexOf('PLIKI');
    let newPath;

    if (index !== -1) {
        newPath = "/" + segments.slice(index + 1).join('/');
        if (newPath === "/") {
            newPath = "";
        }
    } else {
        console.log('PLIKI not found in path');
    }

    fs.readFile(newFilePath, 'utf8', function (err, data) {
        if (err) {
            res.status(404).render('error.hbs', { error: "File not found" });
            return;
        }
        let Rows = data.split("\n").length
        res.render('edytor.hbs', { name: file, content: data, rows: Rows });
    });

});

app.get('/Image/:filename', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const file = req.params.filename
    const currentFilePath = path.join(__dirname, currentFolder);
    const newFilePath = path.join(currentFilePath, file);

    currentFile = newFilePath;


    res.render('image.hbs', { name: file, path: newFilePath, effects: effects });


});


app.get('/FREM/:folder', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const folder = req.params.folder;
    const currentFolderPath = path.join(__dirname, currentFolder);
    const newFolderPath = path.join(currentFolderPath, folder);

    let segments = currentFolderPath.split(path.sep);
    let index = segments.indexOf('PLIKI');
    let newPath;
    if (index !== -1) {
        newPath = "/" + segments.slice(index + 1).join('/');
        if (newPath === "/") {
            newPath = "";
        }
    } else {
        console.log('PLIKI not found in path');
    }

    fs.rmdir(newFolderPath, (err) => {
        res.redirect(`/FileManager2/PLIKI${newPath}`)
    })
});

app.get('/FIREM/:file', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const file = req.params.file;
    const currentFilePath = path.join(__dirname, currentFolder);
    const newFilePath = path.join(currentFilePath, file);

    let segments = currentFilePath.split(path.sep);
    let index = segments.indexOf('PLIKI');
    let newPath;
    if (index !== -1) {
        newPath = "/" + segments.slice(index + 1).join('/');
        if (newPath === "/") {
            newPath = "";
        }
    } else {
        console.log('PLIKI not found in path');
    }
    fs.unlink(newFilePath, (err) => {
        res.redirect(`/FileManager2/PLIKI${newPath}`)
    })
});

app.get('/info/:id', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const id = req.params.id;
    const element = TAB.find(obj => obj.id === parseInt(id - 1));
    console.log(element)
    res.render('info.hbs', { element: element });
});

app.get('/info', function (req, res) {
    if (!Cookie_Check(req, res)) return
    res.render('info.hbs');
});

app.get('/delete/:id', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const id = req.params.id
    TAB.splice(id, 1)
    res.redirect('/FileManager')
});

app.get('/show/:id', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const id = req.params.id
    const element = TAB.find(obj => obj.id === parseInt(id - 1));
    console.log(element.data.path)
    res.sendFile(element.data.path)
});

app.get('/download/:id', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const id = req.params.id;
    const element = TAB.find(obj => obj.id === parseInt(id - 1));
    res.download(element.data.path)
});

app.get('/reset', function (req, res) {
    if (!Cookie_Check(req, res)) return
    TAB = []
    res.redirect('/FileManager')
});

app.post('/Save', function (req, res) {
    if (!Cookie_Check(req, res)) return
    let TXT = req.body.Text
    let file = req.body.File
    const currentFilePath = path.join(__dirname, currentFolder);
    const newFilePath = path.join(currentFilePath, file);

    let segments = currentFilePath.split(path.sep);
    let index = segments.indexOf('PLIKI');
    let newPath;
    if (index !== -1) {
        newPath = "/" + segments.slice(index + 1).join('/');
        if (newPath === "/") {
            newPath = "";
        }
    } else {
        console.log('PLIKI not found in path');
    }

    fs.writeFile(newFilePath, TXT, function (err) {
        if (err) {
            return console.log(err);
        }
    });


});

app.post('/FoCo', function (req, res) {
    if (!Cookie_Check(req, res)) return
    let message = req.body.message

    console.log(message)
    console.log(req.body)
    if (message == "Save") {
        let font = req.body.font
        let color = req.body.color
        Font_color.Font = font
        Font_color.Color = color
    }
    else if (message == "Retrive") {
        res.send(Font_color)
    }

});

app.get('/Show', function (req, res) {
    if (!Cookie_Check(req, res)) return
    console.log("PODGLADDDDDDD")
    console.log(currentFile)
    res.sendFile(currentFile)
});


app.get('/AddFolder', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const FN = req.query.folderName
    const currentFolderPath = path.join(__dirname, currentFolder);
    const newFolderPath = path.join(currentFolderPath, FN);

    let segments = currentFolderPath.split(path.sep);
    let index = segments.indexOf('PLIKI');
    let newPath;
    if (index !== -1) {
        newPath = "/" + segments.slice(index + 1).join('/');
        if (newPath === "/") {
            newPath = "";
        }
    } else {
        console.log('PLIKI not found in path');
    }


    if (!fs.existsSync(newFolderPath)) {
        fs.mkdir(newFolderPath, (err) => {
            res.redirect(`/FileManager2/PLIKI${newPath}`)
            if (err) throw err
            console.log("Folder utworzony");
        })
    }
    else {
        res.redirect(`/FileManager2/PLIKI${newPath}`)
    }

});

app.get('/AddFile', function (req, res) {
    if (!Cookie_Check(req, res)) return
    const FN = req.query.fileName
    const currentFilePath = path.join(__dirname, currentFolder);
    const newFilePath = path.join(currentFilePath, FN);

    let segments = currentFilePath.split(path.sep);
    let index = segments.indexOf('PLIKI');
    let newPath;
    let ext = getFileExtension(FN)

    if (index !== -1) {
        newPath = "/" + segments.slice(index + 1).join('/');
        if (newPath === "/") {
            newPath = "";
        }
    } else {
        console.log('PLIKI not found in path');
    }
    if (!fs.existsSync(newFilePath)) {
        if (ext == 'txt') {
            fs.writeFile(newFilePath, txtD, (err) => {
                res.redirect(`/FileManager2/PLIKI${newPath}`)
                if (err) throw err
                console.log("Plik textowy utworzony");
            })
        }
        else if (ext == 'css') {
            fs.writeFile(newFilePath, cssD, (err) => {
                res.redirect(`/FileManager2/PLIKI${newPath}`)
                if (err) throw err
                console.log("Plik textowy utworzony");
            })
        }
        else if (ext == 'html') {
            fs.writeFile(newFilePath, htmlD, (err) => {
                res.redirect(`/FileManager2/PLIKI${newPath}`)
                if (err) throw err
                console.log("Plik textowy utworzony");
            })
        }
        else if (ext == 'js') {
            fs.writeFile(newFilePath, jsD, (err) => {
                res.redirect(`/FileManager2/PLIKI${newPath}`)
                if (err) throw err
                console.log("Plik textowy utworzony");
            })
        }
        else if (ext == 'json') {
            fs.writeFile(newFilePath, jsonD, (err) => {
                res.redirect(`/FileManager2/PLIKI${newPath}`)
                if (err) throw err
                console.log("Plik textowy utworzony");
            })
        }
        else if (ext == 'xml') {
            fs.writeFile(newFilePath, xmlD, (err) => {
                res.redirect(`/FileManager2/PLIKI${newPath}`)
                if (err) throw err
                console.log("Plik textowy utworzony");
            })
        }
        else {
            fs.writeFile(newFilePath, '', (err) => {
                res.redirect(`/FileManager2/PLIKI${newPath}`)
                if (err) throw err
                console.log("Plik textowy utworzony");
            })
        }
    }
    else {
        res.redirect(`/FileManager2/PLIKI${newPath}`)
    }
});

app.post("/REG_USER", function (req, res) {
    let login = req.body.usr
    let password = req.body.psw
    let error = ""

    if (password[0] != password[1]) {
        error = "Hasła nie są takie same !"
        res.render('error.hbs', { error: error });
    }
    else if (Users.some(user => user.login === login)) {
        error = "Ten login już isntnieje !"
        res.render('error.hbs', { error: error });
    }
    else {
        Users.push({ login: login, password: password[0] })
        res.redirect('/login');
        console.log(Users)
    }
})

app.post("/LOG_USER", function (req, res) {
    let login = req.body.usr
    let password = req.body.psw
    let error = ""

    if (Users.some(user => user.login === login && user.password === password)) {
        res.cookie("login", login, { httpOnly: true, maxAge: 60 * 60 * 1000 });
        res.render('index.hbs');
    }
    else {
        error = "Niepoprawne dane logowania !"
        res.render('error.hbs', { error: error });
    }
})

app.get("/LOG_OUT", function (req, res) {
    res.clearCookie("login");
    res.redirect("/login");
})

app.get("/login", function (req, res) {
    res.render('login.hbs');
})

app.get("/register", function (req, res) {
    res.render('register.hbs');
})


app.get("/", function (req, res) {
    if (!Cookie_Check(req, res)) return
    console.log(TAB)
    res.render('index.hbs');
})

app.use(express.static(path.join(__dirname, 'static')));

app.use(express.static(path.join(__dirname, 'PLIKI')));

app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})