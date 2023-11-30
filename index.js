const express = require ('express');
const app = express();
const fs = require('fs');
const dateInfo = require('./dateTimeFnc');
const mysql = require ('mysql2');
const bodyparser = require('body-parser');
const dbConfig = require ('../../vp23config');
const multer = require('multer');
const upload = multer({dest: './public/gallery/orig/'});
const mime = require('mime');
//const sharp = require('sharp');
const async = require('async');
//krüpteerimiseks
const bcrypt = require('bcrypt');
//sessiooni jaoks
const session = require('express-session');

app.use(session({secret: 'myAbsolutelySecretGeneratedKey', saveUninitialized: true, resave: false}));

let mySession;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended: false}));
//loon andmebaasiühenduse
const conn = mysql.createConnection({
    host: dbConfig.configData.host,
    user: dbConfig.configData.user,
    password: dbConfig.configData.password,
    database: 'if23_sten_rs'
});

app.post('/', (req, res) => {
    let notice = '';
    if(!req.body.emailInput || !req.body.passwordInput) {
        console.log('Logimine ebaõnnestus!');
    }
    else {
        console.log('Logimine õnnestus!');
        let sql = 'SELECT password FROM vp_users WHERE email = ?'
        conn.execute(sql, [req.body.emailInput], (err, result) => {
            if(err) {
                notice = 'Tehnilise vea tõttu sisse logida ei saa!';
                console.log('ei saa andmebaasist loetud');
            }
            else {
                console.log(result);
                if(result.length == 0) {
                    console.log('Tühi!');
                    notice = 'Viga kasutajatunnuses või paroolis!';
                }
                else {
                    //võrdleme parooli andmebaasist saaduga
                    bcrypt.compare(req.body.passwordInput, result[0].password, (err, compresult) => {
                        if(err) {
                            throw err;
                        }
                        else {
                            if (compresult) {
                                console.log('Sisse!');
                                notice = 'Saad sisse logitud!';
                                mySession = req.session;
                                mySession.userName = req.body.emailInput;
                            }
                            else {
                                console.log('Jääd välja');
                                notice = 'Ei saa sisse logitud!';
                            }
                        }
                    });
                }
            }
        });
    }
    res.render('index', {notice: notice});
});

//route
app.get('/', (req, res)=>{
    //res.send('See töötab!');
    res.render('index');
});

app.get('/logout', (req, res) => {
    console.log(mySession.userName);
    console.log('Välja!');
    req.session.destroy();
    mySession = null;
    res.redirect('/');
});

app.get('/signup', (req, res) => {
    res.render('signup');
})

app.post('/signup', (req, res) => {
    //MINU KONTO: tlu email & parool adminpowerbaby
    console.log(req.body);
    let notice = 'Ootel!';
    //Javascript AND -> && OR -> ||
    if(!req.body.firstNameInput || !req.body.lastNameInput || !req.body.genderInput || !req.body.birthInput || !req.body.emailInput || !req.body.passwordInput || req.body.passwordInput.length < 8 || req.body.passwordInput !== req.body.confirmPasswordInput) {
        console.log("Andmeid puudu!");
        notice = 'Andmeid puudu või sobimatud';
        res.render('signup', {notice:notice});
    }
    else {
        console.log("OK!");
        notice = 'Ok!'
        //"soolame" ja krüpteerime parooli
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(req.body.passwordInput, salt, (err, pwdHash) => {
                let sql = 'INSERT INTO vp_users (firstname, lastname, birthdate, gender, email, password) VALUES (?, ?, ?, ?, ?, ?)';
                conn.execute(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthInput, req.body.genderInput, req.body.emailInput, pwdHash], (err, result) => {
                    if(err) {
                        notice = 'Andmete salvestamine ebaõnnestus!';
                        res.render('signup', {notice:notice});

                    }
                    else {
                        notice = 'Kasutaja ' + req.body.emailInput + ' lisamine õnnestus!';
                        res.render('signup', {notice:notice});
                    }
                });
            });
        });
    }
});

app.get('/wisdom', (req, res)=>{
    let folkWisdom = [];
    fs.readFile("public/txtfiles/vanasonad.txt", "utf8", (err, data)=>{
        if(err){
            console.log(err);
        }
        else{
            //console.log(data);
            folkWisdom = data.split(";");
            res.render('justlist', {h1: 'Vanasõnad', wisdoms: folkWisdom});
        }
    });
});

app.get('/timenow', (req, res)=>{
   const dateNow = dateInfo.dateNowET();
   const timeNow = dateInfo.timeNowET();
   res.render('timenow', {dateN: dateNow, timeN: timeNow}); 
});

app.get('/logdetails', (req, res) => {
    fs.readFile("public/txtfiles/log.txt", "utf8", (err, data) => {
        if (err) {
            throw err;
        }
        else {
            data = data.trim();
            const splitData = data.split(";"); //splitib andmed
            const allNames = []; //list
            console.log(splitData)
            /*splitData.forEach(line => {
                const splitDataValues = line.split(',');*/
            if(splitData.length >=3){
                const inputName = {
                    firstName: splitData[0],
                    lastName: splitData[1],
                    date: splitData[2]
                };
            allNames.push(inputName);
            }
        };
        res.render('logdetails', {h1: 'Log', logdata: allNames});
    });
});

app.get('/eestifilm', (req, res)=>{
    //res.send('See töötab!');
    res.render('eestifilmindex');
});

app.get('/eestifilm/filmiloend', (req, res)=>{
    //res.send('See töötab!');
    let sql = 'SELECT title, production_year FROM movie'
    let sqlresult = [];
    conn.query(sql, (err, result) => {
        if (err) {
            throw err
            res.render('eestifilmlist', {filmlist: sqlresult});
        }
        else {
        console.log(result[4].title);
        sqlresult = result;
        res.render('eestifilmlist', {filmlist: sqlresult});
        }
    });
    //res.render('eestifilmlist', {filmlist: sqlresult});
});

app.get('/eestifilm/lisapersoon', (req, res)=>{
    res.render('eestifilmAddPerson');
});

app.post('/eestifilm/lisapersoon', (req, res) =>{
    console.log(req.body);
    let notice = '';
    let sql = 'INSERT INTO person (first_name, last_name, birth_date) VALUES (?, ?, ?)';
    conn.query(sql, [req.body.firstNameInput, req.body.lastNameInput, req.body.birthDateInput], (err, result) =>{
        if(err){
            throw err;
            notice = 'Andmete salvestamine ebaõnnestus!' + err;
            res.render('eestifilmAddPerson', {notice: notice});
        }
        else {
            notice = 'Filmitegelase ' + req.body.firstNameInput + ' ' + req.body.lastNameInput + ' salvestamine õnnestus!';
            res.render('eestifilmAddPerson', {notice: notice});
        }
    });
});

app.get ('/eestifilm/singlemovie', (req, res) =>{
    let sqlresult = [];
    res.render('eestifilmsinglemovie', {data: sqlresult});
});

app.post('/eestifilm/singlemovie', (req, res) =>{
    //console.log(req.body);
    let sqlresult = [];
    let sql = 'SELECT title, production_year, duration, description FROM movie WHERE id = ?';
    conn.query(sql, req.body.movieId, (err, result) =>{
        if (err){
            throw err;
            res.render('eestifilmsinglemovie', {data: sqlresult});
        }
        else {
            sqlresult = result;
            res.render('eestifilmsinglemovie', {data: sqlresult});
        //console.log(sqlresult);
            
        }
    });
});

app.get('/eestifilm/lisaseos', (req, res)=>{
	//res.send('See töötab!');
	//paneme async mooduli abil mitu asja korraga tööle
	//1) loome tegevuste loendi
	const myQueries = [
		function(callback){
			conn.execute('SELECT id,title from movie', (err, result)=>{
				if(err) {
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		},
		function(callback){
			conn.execute('SELECT id,first_name, last_name from person', (err, result)=>{
				if(err) {
					return callback(err);
				}
				else {
					return callback(null, result);
				}
			});
		}
	];
	//paneme need tegevused asünkroonselt paralleelselt tööle
	async.parallel(myQueries, (err, results)=>{
		if (err) {
			throw err;
		}
		else {
			console.log(results);
			//mis kõik teha, ka render osa vajalike tükkidega
		}
	});
	
	
	res.render('eestifilmaddrelation');
});

app.get('/news', (req, res) => {
    res.render('news');
});

app.get('/news/add', (req, res) => {
    res.render('addnews');
});

app.get('/news/read', (req, res) => {
    res.render('readnews');
});

app.get('/news/read/:id', (req,res)=> {
	//res.render('readnews');
    let newsId = req.params.id

    let sql = 'SELECT title, content FROM vp_news WHERE id = ? AND expire > ? AND deleted IS NULL';
    let timeSQL = timeInfo.dateSQLformated();
    conn.query(sql, [newsId, timeSQL], (err, result) => {
        if (err) {
            throw err;
            let error = 'Uudiseid ei saadud lugeda';
            res.render('readnews', {allNews: error});
        }
        else {
            if (result.length === 0) {
                res.send('Uudist ei leitud');
            }
            else {
                res.render('readnews', {allNews: result})
            }
        }
    });
});

app.get('/photoupload', checkLogin, (req, res)=> {
	res.render('photoupload');
});

app.post('/photoupload', upload.single('photoInput'), (req, res)=> {
	let notice = '';
	console.log(req.file);
	console.log(req.body);
	//const mimeType = mime.getType(req.file.path);
	//console.log(mimeType);
	const fileName = 'vp_' + Date.now() + '.jpg';
	//fs.rename(req.file.path, './public/gallery/orig/' + req.file.originalname, (err)=> {
	fs.rename(req.file.path, './public/gallery/orig/' + fileName, (err)=> {
		console.log('Viga: ' + err);
	});
	const mimeType = mime.getType('./public/gallery/orig/' + fileName);
	console.log('Tüüp: ' + mimeType);
	//loon pildist pisipildi (thumbnail)
	sharp('./public/gallery/orig/' + fileName).resize(800,600).jpeg({quality : 90}).toFile('./public/gallery/normal/' + fileName);
	sharp('./public/gallery/orig/' + fileName).resize(100,100).jpeg({quality : 90}).toFile('./public/gallery/thumbs/' + fileName);
	
	
	let sql = 'INSERT INTO vp_gallery (filename, originalname, alttext, privacy, userid) VALUES (?,?,?,?,?)';
	const userid = 1;
	connection.execute(sql, [fileName, req.file.originalname, req.body.altInput, req.body.privacyInput, userid], (err, result)=>{
		if(err) {
			throw err;
			notice = 'Foto andmete salvestamine ebaõnnestus!' + err;
			res.render('photoupload', {notice: notice});
		}
		else {
			notice = 'Pilt "' + req.file.originalname + '" laeti üles!';
			res.render('photoupload', {notice: notice});
		}
	});
});

app.get('/photogallery', (req, res)=> {
	let photoList = [];
	let sql = 'SELECT id,filename,alttext FROM vp_gallery WHERE privacy > 1 AND deleted IS NULL ORDER BY id DESC';
	connection.execute(sql, (err,result)=>{
		if (err){
			throw err;
			res.render('photogallery', {photoList : photoList});
		}
		else {
			photoList = result;
			//console.log(result);
			res.render('photogallery', {photoList : photoList});
		}
	});
});

//funktsioon, mis kontrollib sisselogimist. On vahevara (middleware)
function checkLogin(req, res, next) {
    console.log('Kontrollime, kas on sisse logitud!');
    if(mySession != null) {
        if (mySession.userName) {
            console.log('Ongi sees');
            next();
        }
        else {
            console.log('Polnud sisse loginud!');
            res.redirect('/');
        }
    }
    
}

app.listen(5211);