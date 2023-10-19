const express = require ('express');
const app = express();
const fs = require('fs');
const dateInfo = require('./dateTimeFnc');
const mysql = require ('mysql2');
const bodyparser = require('body-parser');
const dbConfig = require ('../../vp23config');

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

//route
app.get('/', (req, res)=>{
    //res.send('See töötab!');
    res.render('index');
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

app.listen(5211);