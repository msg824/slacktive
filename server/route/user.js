//  ------------------------------------- First Setting -------------------------------------
const express = require("express");
const router = express.Router();
const models = require("../models");
const _ = require("lodash");

// DB Setting --------------------
const User = models.user;
 
// ------------------------------------- DB CRUD -------------------------------------
// DB SelectAll --------------------
router.get("/all", async(req, res) => {
    try {
        const result = await User.findAll();
        res.send(result);
    } catch(err) {
        console.log("select users all err : " + err)
    }
});

// DB SelectOne --------------------
router.get("/one", async(req, res) => {
    try {
        const result = await User.findOne({
            where : {
                userid : req.query.userid
            }
        });
        res.send(result);
    } catch(err) {
        console.log("select user one err : " + err);
    }
});

// DB FineOrCreate --------------------
router.post("/create", async(req, res) => {
    let result = false;
    try{
        await User.findOrCreate({
            where : {
                userid : req.body.userid,
            },
            defaults : {
                id : req.body.id,
                userid: req.body.userid, 
                username: req.body.username, 
            }
        }).spread((none, created)=>{
            if(created){
                result = true;
            }
        });
    }catch(err) {
        console.error("created user err : " + err);
    }
    res.send(result);
});

// DB Update --------------------
router.put("/update", async(req, res) => {
    let result = null;
    try {
        await User.update({ 
            id : req.body.id,
            userid : req.body.userid,
            username: req.body.username,
            useremail: req.body.useremail, 
            userphone : req.body.userphone,
            p_token : req.body.p_token,
            b_p_token : req.body.b_p_token,
            state : req.body.state 
            }, {
            where: {
                userid : req.body.userid
            }
        });
        result = true;
    } catch(err) {
        console.error("user update err : " + err);
        result = false;
    }
    console.log("update : " + result);
    res.send(result);
});

// DB Delete --------------------
router.delete("/delete", async(req, res) => {
    try {
        let result = await User.destroy({
            where: {
                userid: req.query.userid
            }
        });
        res.send(result);
    } catch(err) {
        console.log("delete user err : " + err);
    }
});

// Module Exports --------------------
module.exports = router;