//  ------------------------------------- First Setting -------------------------------------
const express = require("express");
const router = express.Router();
const models = require("../models");
const moment = require("moment");

// DB Setting --------------------
const Holiday = models.holiday;
const User = models.user;
const Op = models.Sequelize.Op;
 
// ------------------------------------- DB CRUD -------------------------------------
// DB SelectAll --------------------
router.get("/all", async(req, res) => {
    try {
        const result = await Holiday.findAll({
            include : [{
                model : models.user,
            }],
            order : [[
                'id' , 'ASC'
            ]]
        });
        res.send(result);
    } catch(err) {
        console.log("select Holiday all err : " + err)
        res.end();
    }
});

// DB SelectAll Users Holiday ( 휴가자 체크 ) --------------------
router.get("/alltime", async(req, res) => {
    try {
        const today = moment().format('YYYY-MM-DD');

        const result = await Holiday.findAll({
            include : [{
                model : models.user,
            }],
            order : [[
                'id' , 'ASC'
            ]],
            where : {
                textTime : models.Sequelize.literal(`textTime like '%${today}%'`)
            }
        });

        const clock = moment().format("HH:mm");
        for (let i = 0; i < result.length; i++) {
            let holidayList = result[i].dataValues.userId;
            let holidayCate = result[i].dataValues.cate;

            if (holidayCate === "휴가" || holidayCate === "병가") {
                await User.update({
                    state : '휴가'
                }, {
                    where : {
                        id : holidayList
                    }
                });
            } else if (holidayCate === "오전반차") {
                if (clock < "14:00") {
                    await User.update({
                        state : '휴가'
                    }, {
                        where : {
                            id : holidayList
                        }
                    });
                }
            } else if (holidayCate === "오후반차") {
                if (clock > "15:30") {
                    await User.update({
                        state : '휴가'
                    }, {
                        where : {
                            id : holidayList
                        }
                    });
                }
            }
        }

        res.send(result);
    } catch(err) {
        console.log("select Holiday all err : " + err)
        res.end();
    }
});

// DB SelectAll One User Holiday --------------------
router.get("/gettime", async(req, res) => {
    try {
        const result = await Holiday.findAll({
            include : [{
                model : models.user,
            }],
            order : [[
                'ts' , 'desc'
            ]],
            where : {
                textTime : models.Sequelize.literal(`textTime like '%${req.query.textTime}%'`),
                userId : req.query.userId
            }
        });
        res.send(result);
    } catch(err) {
        console.log("select Holiday all err : " + err)
        res.send(false);
    }
});
// DB SelectAll One User Holiday --------------------
router.get("/gettimesetholiday", async(req, res) => {
    try {
        const result = await Holiday.findAll({
            include : [{
                model : models.user,
                attributes : ['username']
            }],
            attributes : ['cate','textTime'],
            order : [[
                'ts' , 'desc'
            ]],
            where : {
                textTime : {
                    [Op.like] : "%" + req.query.textTime + "%",
                },
                userId : {
                    [Op.like] : "%" + req.query.userId + "%",
                },
            }
        });
        const resultSet = [];
        let subCount = 0;
        result.forEach(data => {
            if(/휴가/g.test(data.dataValues.cate)) {
                subCount += 1;
                resultSet.push({
                    cate : data.dataValues.cate,
                    textTime : data.dataValues.textTime,
                    user : data.dataValues.user,
                })
            } else if(/반차/g.test(data.dataValues.cate)) {
                subCount += 0.5;
                resultSet.push({
                    cate : data.dataValues.cate,
                    textTime : data.dataValues.textTime,
                    user : data.dataValues.user,
                })
            }
        })
        await User.update({
            holidaycount : (20 - subCount)
        },{
            where : {
                id : req.query.userId
            }
        });
        res.send(subCount+"");
    } catch(err) {
        console.log("select Holiday all err : " + err)
        res.end();
    }
});

// DB SelectOne --------------------
router.get("/one", async(req, res) => {
    try {
        const result = await Holiday.findOne({
            where : {
                id : req.query.id
            }
        });
        res.send(result);
    } catch(err) {
        console.log("select Holiday one err : " + err);
        res.end();
    }
});

// DB SelectOne Id --------------------
router.get("/oneRow", async(req, res) => {
    try {
        let result = await Holiday.findOne({
            limit : 1,
            order : [
                [ 'time','DESC']
            ]
        });
        res.send(result);
    } catch (err){
        console.log("select chat one err : " + err);
        res.end();
    }
});

// DB FineOrCreate --------------------
router.post("/create", async(req, res) => {
    let result = false;
    try{
        await Holiday.create({
            text: req.body.text,
            time : req.body.time,
            ts : req.body.ts,
            cate : req.body.cate,
            state : req.body.state,
            textTime : req.body.textTime,
            userId : req.body.userId,
        });
    }catch(err) {
        console.error("created Holiday err : " + err);
        res.end();
    }
    res.send(result);
});

// DB Update --------------------
router.put("/update", async(req, res) => {
    let result = true;
    try {
        await Holiday.update({ 
            text: req.body.text,
            cate : req.body.cate,
            state : req.body.state,
            textTime : req.body.textTime,
            }, {
            where: {
                id : req.body.id,
            }
        });
    } catch(err) {
        console.error("Holiday update err : " + err);
        result = false;
    }
    res.send(result);
});

// DB Delete --------------------
router.delete("/delete", async(req, res) => {
    let result = true;
    try {
        await Holiday.destroy({
            where: {
                id: req.query.id
            }
        });
    } catch(err) {
        result = false;
        console.log("delete Holiday err : " + err);
    }
    res.send(result);
});

// DB vacation --------------------
router.get("/vacation", async(req, res) => {
    try {
        const query = `select * from holidays where cate='${req.query.cate}' and userid='${req.query.userid}' and time >= '${req.query.time}' and time <= '${req.query.time2}'`;
        let result = await models.sequelize.query(query, { type : models.sequelize.QueryTypes.SELECT ,raw : true})
        res.send(result);
    } catch (err){
        console.log("select vacation err : " + err);
    }
});

// DB halfVacation --------------------
router.get("/halfVacation", async(req, res) => {
    try {
        const query = `select * from holidays where cate like '%반차' and userid='${req.query.userid}' and time >= '${req.query.time}' and time <= '${req.query.time2}'`;
        let result = await models.sequelize.query(query, { type : models.sequelize.QueryTypes.SELECT ,raw : true})
        res.send(result);
    } catch (err){
        console.log("select halfVacation err : " + err);
    }
});

// 오전 반차 예외처리
router.get("/halfexception", async(req, res) => {
    try {
        // 현재 날짜 기준으로 오전반차 휴가 기록이 있는지 확인
        const query = `SELECT JSON_EXTRACT(textTime, '$[0].startDate') FROM holidays WHERE JSON_EXTRACT(textTime, '$[0].startDate') = '${req.query.date}' AND cate = '오전반차' AND userid = '${req.query.userid}'`;
        let result = await models.sequelize.query(query, { type : models.sequelize.QueryTypes.SELECT ,raw : true})
        res.send(result);

    } catch (err) {
        console.log("halfexception", err);
    }
})

// Module Exports --------------------
module.exports = router;