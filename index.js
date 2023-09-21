require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

// Req
const mongoose = require('mongoose');

// Mongoose
const { Schema } = mongoose;

mongoose.connect(process.env.MONGO_URL);

const userSchema = new Schema({
  username: String,
});

const User = mongoose.model("User", userSchema);

const exerciseSchema = new Schema({
  user_id: {type: String, required: true},
  description: String,
  duration: Number,
  date: Date,
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users', async (req, res) => {
  console.log(req.body.username);

  if(!req.body.username) { res.json({error: "Enter the username"})}

  const newUser = new User({
    username: req.body.username
  });

  const user = await newUser.save()
    .then(result => res.send({username: result.username, _id: result._id}))
    .catch(err => console.error(err));

});

app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.send(users);
});

app.post('/api/users/:_id/exercises', async(req, res) => {
  console.log(req.body)

  const user = await User.findById(req.params._id);
  if(!user) {
    res.send("User not found");
  } else {
    const newExercise = new Exercise({
      user_id: req.params._id,
      description: req.body.description,
      duration: +req.body.duration,
      date: req.body.date ? new Date(req.body.date) : new Date(),
    });

    const exercise = await newExercise.save()
    .then(result => res.send({
      username: user.username,
      description: result.description,
      duration: +result.duration,
      date: new Date(result.date).toDateString(),
      _id: user._id,
    }))
    .catch(err => console.error(err));
  }
});
app.get('/api/users/:_id/logs', async(req, res) => {

  const { from, to, limit } = req.query;

  const user = await User.findOne({
    _id: req.params._id
  });

  if(!user) {
    res.send("User not found");
  } else {

    let filterObj = {}

    if(from) {
      filterObj["$gte"] = new Date(from);
    }
    if(to) {
      filterObj["$lte"] = new Date(to);
    }
  
    let filter = {
      user_id: req.params._id
    }
  
    if(from || to) {
      filter.date = filterObj;
    }
  

    const userExercises = await Exercise.find(filter).limit(limit ?? 1000);
  
    const log = userExercises.map(e => ({
      description: e.description,
      duration: +e.duration,
      date: e.date.toDateString()
    }));
  
    res.send({
      username: user.username,
      count: +userExercises.length,
      _id: req.params._id,
      log
    });
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
