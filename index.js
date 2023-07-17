const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
const express = require('express')
const app = express()
const cors = require('cors');
const port = process.env.PORT || 5000
const jwt=require('jsonwebtoken');
app.use(cors())
app.use(express.json())
require('dotenv').config()


app.get('/',(req,res)=>{
    res.send('i am so hungry')
})

const VerifyJwt=(req,res,next)=>{
    const authorization=req.headers.authorization
    if(!authorization){
      return res.status(401).send({error:true,message:'unauthorized access'})
    }
    const token=authorization.split(' ')[1]

    jwt.verify(token,process.env.VITE_JWT,(error,decode)=>{
      if(error){
        return res.status(401).send({error:true,message:'unauthorized access'})
      }
      req.decode=decode
      next()
    })
}

const uri = `mongodb+srv://${process.env.VITE_USER}:${process.env.VITE_PASS}@cluster0.9rjxxtl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const menu=client.db('panda-restaurant').collection('menu')
    const review=client.db('panda-restaurant').collection('reviews')
    const user=client.db('panda-restaurant').collection('user')
    const order=client.db('panda-restaurant').collection('order')
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // JWT
    app.post('/jwt',async(req,res)=>{
      const user=req.body
      const token= jwt.sign(user,process.env.VITE_JWT,{expiresIn:'1d'})
      res.send(token)
    })

    
    // get all menu
    app.get('/getMenus',async(req,res)=>{
        const result=await menu.find().toArray()
        res.send(result)
    })
    // get single user order
    app.get('/getSingleUserOrder/:email',VerifyJwt, async(req,res)=>{
      const email=req.params.email 
      const query={email:email}
      const result=await order.find(query).toArray()
      res.send(result)
    })

    // added user in mongodb
    app.post('/postUser',async(req,res)=>{
      const data=req.body
      const result=await user.insertOne(data)
      res.send(result)
    })

    // added user order
    app.post('/postOrder',async(req,res)=>{
      const data=req.body
      const result=await order.insertOne(data)
      res.send(result)
    })

    // get all user 
    app.get('/getAllUser',VerifyJwt, async(req,res)=>{
      const result=await user.find().toArray()
      res.send(result)
    })

    //make admin
    app.patch('/makeAdmin/:email',VerifyJwt, async(req,res)=>{
      const email=req.params.email
      const query={email:email}
      const update={
        $set:{
          role:'admin'
        }
      }
      const result =await user.updateOne(query,update)
      res.send(result)
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.listen(port)