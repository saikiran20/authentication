const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')

const app = express()

const dbPath = path.join(__dirname, 'userData.db')

app.use(express.json())

let db = null

const initilaizeDbandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server Running at http://localhost:3000/'),
    )
  } catch (error) {
    console.log(`Db Error:${error.message}`)
  }
}
initilaizeDbandServer();

// API 1 /register

app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
      const createUserQuery = `INSERT INTO user (username, name, password, gender, location) 
            VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`
      if (password.length < 5) {
      response.status = 400
      response.send('Password is too short')
      }
        else{
        await db.run(createUserQuery)
        response.status = 200
        response.send('User created successfully')
          }
  }
 else {
    response.status = 400
    response.send('User already exists')
  }
})

//API 2 /login

app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status = 400
    response.send('Invalid user')
  } else {
      const isPasswordMatch=await bcrypt.compare(password,dbUser.password);
      if(isPasswordMatch===true){
          response.send('Login success!');
          response.status = 200;
      }
      else{
            response.status = 400
            response.send('Invalid password')
      }
  }
})

//API 3 /change-password

app.post('/change-password', async (request, response) => {
  const {username,oldPassword, newPassword} = request.body
  const selectUserQuery = `SELECT * FROM user WHERE username='${username}';`
  const dbUser = await db.get(selectUserQuery);

  if(oldPassword!==dbUser.password){
        response.status = 400
        response.send('Invalid current password')
  }
  else {
      if(newPassword.length<5){
              response.status = 400
              response.send('Password is too short')
      }
      else{
        const hashedPassword=await bcrypt.hash(newPassword,10);
            const updatePasswordQuery=`UPDATE user SET password='${hashedPassword}' WHERE username='${username}';`;
            await db.run(updatePasswordQuery);
            response.send('Password updated');
            response.status = 200; 
      }
    
  }
})

module.exports=app;
