import React from 'react';
import '../css/mypage.css';
import moment from 'moment';
import axios from 'axios';
import MyDashboard from './My_Dashboard/MyDashboard';

let configs = {};
process.env.NODE_ENV === 'development' ? configs = require('../../../devClient_config') : configs = require('../../../client_config');

class mypage extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            // user token & user data
            usertoken : null,
            user : [],
            // today date
            today : moment(new Date()).format("YYYY-MM"),  // 오늘 년,월
            toYear : moment(new Date()).format("YYYY"),     // 이번년도
            // api datas
            tardys : "",    // 지각
            tardysSub : "",
            atten : "",     // 출근
            avgAtten : [],  // 평균 출근
            avgAttenSub : [],
            nightShift : "",// 야근
            nightShiftSub : "",
            holidayHistorys : [],   // 휴가 내역
            holidayCount : 0,
            // modal
            modalOnOff : "mypage-modal-inv",
            modalDb : [],       // 모달의 전체 내용을 담을 곳
            modalBtn : [],      // 모달에 들어갈 버튼 수
            modalState : "",    // 클릭한 모달이 무엇인지
            currentPage : 1,    // 현재 페이지 번호
            groupPage : 5,      // 한 그룹에 보여질 페이지 수
            currentGroup : 0,   // 현재 그룹
            maxPage : 5,        // 총 페이지 수
            pageContents : 6,   // 페이지에 보여질 갯 수
            // transition
            mainClass : "mypage-mainDiv-fade",
        }
    }
    async componentDidMount(){
        // 유저 토큰 값
        await this.setState({
            usertoken : await this.props.Token
        })
        const { usertoken } = this.state;
        // user Db setting
        await this.setState({
            user : await axios.get(`${configs.domain}/user/one?userid=${usertoken}`)
        })
        // 동시에 처리
        const tardy = this.tardyApi();   // 지각
        const avgAten = this.avgAttenTimeApi();    // 평균 출근 시간
        const aten = this.attenApi();   // 출근
        const nigSft = this.nightShiftApi();  // 야근
        const holidays = this.holidayUsageHistoryApi();  // 휴가
        // 전부 값이 처리 될때까지 대기
        await Promise.all([tardy,avgAten,aten,nigSft,holidays]);
        this.setState({ mainClass : "mypage-mainDiv"})
    }
    // ------------------------------ Api & Contents ------------------------------
    // 지각 횟 수 api ------------------------------
    async tardyApi(){
        const { user, today } = this.state;
        try {
            const result = axios.get(`${configs.domain}/slack/state?state=${"지각"}&userid=${user.data.id}&time=${today}&stateSub=${"null"}`)
            const resultSub = axios.get(`${configs.domain}/slack/state?state=${"지각"}&userid=${user.data.id}&time=${today}&sub=${true}&stateSub=${"null"}`)
            await Promise.all([result, resultSub]).then((val)=>{
                this.setState({
                    tardys : val[0].data,
                    tardysSub : (val[1].data - val[0].data),
                })
            })
        } catch(err) {
            console.log("tardy Api err : " + err)
        }
    }
    tardyContents(){
        const { tardys,tardysSub } = this.state;
        return <div className="mypage-dashNumDiv" onClick={this.modalCancel.bind(this,true,"지각")}>
            <span className="mypage-numSpan">지각 횟수</span>
            <img className="mypage-numImgStart" alt="err" src="img/stars.png"></img>
            <img className="mypage-numImg" alt="err" src="img/run.png"></img>
            <span className="mypage-numMainSpan">{tardys ? tardys + "회" : "없음"}</span>
            <span className="mypage-numSpan">지난달보다 {tardysSub}회 감소</span>
        </div>
    }
    // 평균 출근 시간 api ------------------------------
    async avgAttenTimeApi(){
        const { user,today } = this.state;
        try {
            let diffTime = [];
            let result = axios.get(`${configs.domain}/slack/time?state=${"출근"}&userid=${user.data.id}&time=${today}&stateSub=${"지각"}`)
            let resultSub = axios.get(`${configs.domain}/slack/time?state=${"출근"}&userid=${user.data.id}&time=${today}&stateSub=${"지각"}&sub=${true}`)
            await Promise.all([result, resultSub]).then(val =>{
                this.setState({
                    avgAtten : /^(\d{2}):(\d{2})/.exec(val[0].data),
                    avgAttenSub : /^(\d{2}):(\d{2})/.exec(val[1].data),
                })
                diffTime = /^(\d{2}):(\d{2})/.exec(val[0].data)
            })
            diffTime[0] = moment(new Date()).format("YYYY-MM-DD ") + diffTime[0];
            diffTime[1] = moment(new Date()).format("YYYY-MM-DD ") + this.state.avgAttenSub[0];
            this.setState({
                avgAttenSub : diffTime
            })
        } catch(err) {
            console.log("tardy Api err : " + err)
        }
    }
    avgAttenTimeContents(){
        const { avgAtten,avgAttenSub } = this.state
        return <div className="mypage-dashNumDiv" onClick={this.modalCancel.bind(this,true,"평균시간")}>
            <span className="mypage-numSpan">평균 출근시간</span>
            <img className="mypage-numImgStart" alt="err" src="img/stars.png"></img>
            <img className="mypage-numImg" alt="err" src="img/clock.png"></img>
            <span className="mypage-numMainSpan">{avgAtten ? avgAtten[1] : "00"}시 {avgAtten ? avgAtten[2] : "00"}분</span>
            <span className="mypage-numSpan">지난달보다&nbsp;
                {
                    moment.duration(moment(avgAttenSub[1]).diff(avgAttenSub[0])).asMinutes() >= 0 ? 
                    moment.duration(moment(avgAttenSub[1]).diff(avgAttenSub[0])).asMinutes() + "분 빠름" 
                    : 
                    moment.duration(moment(avgAttenSub[1]).diff(avgAttenSub[0])).asMinutes() + "분 느림"
                }
            </span>
        </div>
    }
    // 출근 횟 수 api ------------------------------
    async attenApi(){
        const { user, today } = this.state;
        try {
            const result = await axios.get(`${configs.domain}/slack/state?state=${"출근"}&userid=${user.data.id}&time=${today}&stateSub=${"지각"}`)
            this.setState({
                atten : result.data,
            })
        } catch(err) {
            console.log("tardy Api err : " + err)
        }
    }
    attenContents(){
        const { atten,holidayCount } = this.state;
        return <div className="mypage-dashNumDiv" onClick={this.modalCancel.bind(this,true,"출근")}>
            <span className="mypage-numSpan">출근 일수</span>
            <img className="mypage-numImgStart" alt="err" src="img/stars.png"></img>
            <img className="mypage-numImg" alt="err" src="img/workplace.png"></img>
            <span className="mypage-numMainSpan">{atten}일</span>
            <span className="mypage-numSpan">이번달 연차 {holidayCount}개 사용</span>
        </div>
    }
    // 야근 일 수 api ------------------------------
    async nightShiftApi(){
        const { user, today } = this.state;
        let text = "야근";
        try {
            const result = axios.get(`${configs.domain}/slack/state?state=${text}&userid=${user.data.id}&time=${today}`)
            const resultSet = axios.get(`${configs.domain}/slack/state?state=${text}&userid=${user.data.id}&time=${today}&sub=${true}`)
            await Promise.all([result,resultSet]).then(val=>{
                this.setState({
                    nightShift : val[0].data,
                    nightShiftSub : (val[1].data) - (val[0].data),
                })
            })
        } catch(err) {
            console.log("tardy Api err : " + err)
        }
    }
    nightShiftContents(){
        const { nightShift,nightShiftSub } = this.state;
        return <div className="mypage-dashNumDiv" onClick={this.modalCancel.bind(this,"","야근")}>
            <span className="mypage-numSpan">야근 일수</span>
            <img className="mypage-numImgStart" alt="err" src="img/stars.png"></img>
            <img className="mypage-numImg" alt="err" src="img/overtime.png"></img>
            <span className="mypage-numMainSpan">{nightShift ? nightShift + "일" : "없음"}</span>
            <span className="mypage-numSpan">지난달보다 {nightShiftSub ? nightShiftSub : "0"}회 증가</span>
        </div>
    }
    // 휴가 사용 내역 및 갯수 api ------------------------------
    async holidayUsageHistoryApi() {
        const { toYear,user } = this.state;
        try {
            const result = axios.get(`${configs.domain}/calendar/getTime?textTime=${toYear}&userId=${user.data.id}`)
            const resultSet = axios.get(`${configs.domain}/calendar/getTimeSetHoliday?textTime=${toYear}&userId=${user.data.id}`)
            await Promise.all([result,resultSet]).then(val=>{
                this.setState({
                    holidayHistorys : val[0].data,
                    holidayCount : parseFloat(val[1].data),
                });
            })
        } catch(err) {
            console.log("Holiday Usage History err : " + err);
        }
    }
    // 각 모달에 대한 api ------------------------------
    async modalApi(stateSub) {
        const { user } = this.state;
        let state = `state=${"지각"}`;
        let url = "stateAll"
        if(stateSub === "출근") {
            state = `state=${"지각"}&stateSub=${stateSub}`;
        } else if(stateSub === "야근") {
            state = `state=${stateSub}`;
        } else if(stateSub === "평균시간") {
            url = "stateAllAvg"
        }
        try {
            let result = await axios.get(`http://localhost:5000/slack/${url}?userId=${user.data.id}&${state}`)
            this.setState({ modalDb : result.data });
            this.setState({ maxPage : parseInt(this.state.modalDb.length/this.state.pageContents + 1) })
            this.modalBoard("f");
        } catch (err) {
            console.log("modal api err : " +  err)
        }
    }
    // 모달 게시판 번호 생성
    modalBoard(bool,index) {
        const { currentPage,maxPage } = this.state;
        let pageArr = [];
        let k = bool === "f" ? currentPage - (index ? index : 0) : index;
        for(let i=k, j=0; i<=maxPage; i++,j++) {
            if(j >= 5) break;
            let classNames = "mypage-modal-btnNums";
            let classNamesSpan = "mypage-modal-btn"
            if(currentPage === i) {
                classNames = "mypage-modal-btnNumsSelt";
                classNamesSpan = "mypage-modal-btnSelt";
            }
            let btn = <button key={i} className={classNames} onClick={this.modalNum.bind(this,i,j)}>
                <span className={classNamesSpan}>{i}</span>
            </button>
            pageArr.push(btn);
        }
        this.setState({ modalBtn : pageArr });
    }
    // 모달의 페이지 번호 클릭 시
    async modalNum(num,j) {
        await this.setState({ currentPage : num });
        this.modalBoard("f",j);
    }
    // 모달을 클릭할 시
    modalCancel(bool, state) {
        this.setState({ currentPage : 1, currentGroup : 0 });
        if(state) {
            this.modalApi(state);
        }
        switch(state) {
            case "지각" : this.setState({
                modalState : {
                    title : "지각 횟수",
                    month : "월 구분",
                    count : "지각 횟수",
                }
            }); break;
            case "평균시간" :  this.setState({
                modalState : {
                    title : "출근 시간 내역",
                    month : "날짜",
                    count : "출근 시각",
                }
            }); break;
            case "출근" :  this.setState({
                modalState : {
                    title : "출근 일수",
                    month : "월 구분",
                    count : "출근 일수",
                }
            }); break;
            case "야근" :  this.setState({
                modalState : {
                    title : "야근 내역",
                    month : "날짜",
                    count : "초과 근무시간",
                }
            }); break;
            default : break;
        }
        this.setState({ modalOnOff : bool ? "mypage-modal" : "mypage-modal-inv" });
    }
    // 모달의 화살표를 클릭할 시
    async arrowClick(arrow) {
        const { currentPage, maxPage, groupPage } = this.state;
        if(arrow === "left") {
            if(currentPage <= groupPage)
                await this.setState({ currentPage : 1 })
            else {
                await this.setState({ currentGroup : this.state.currentGroup -1 })
                await this.setState({ currentPage : (this.state.groupPage * this.state.currentGroup) + 5 })
            }
        } else {
            if(currentPage > maxPage - (this.state.groupPage * this.state.currentGroup) + 1)
                await this.setState({ currentPage : maxPage });
            else {
                await this.setState({ currentGroup : this.state.currentGroup +1 });
                await this.setState({ currentPage : (this.state.groupPage * this.state.currentGroup) + 1 })
            }
        }
        this.modalBoard("t",((this.state.groupPage * this.state.currentGroup) + 1));
    }
    // 모달 팝업창
    modalContents() {
        const { modalOnOff, modalState,
            modalDb, currentPage, modalBtn, pageContents
        } = this.state;
        return <div className={modalOnOff}>
            <div className="mypage-modal-title">
                <span className="mypage-modal-titleText">{modalState.title}</span>
                <span className="mypage-modal-cancel" onClick={this.modalCancel.bind(this, false,false)}>x</span>
            </div>
            <div className="mypage-modal-tag">
                <span className="mypage-modal-month">{modalState.month}</span>
                <span className="mypage-modal-count">{modalState.count}</span>
            </div>
            <div className="mypage-modal-lines"></div>
            <div className="mypage-modal-subLine"></div>
            <div className="mypage-modal-body">
                <div className="mypage-modal-main">
                    {
                        modalDb && modalDb.map((data,i)=>{
                            if((currentPage - 1) * pageContents > i || currentPage * pageContents <= i)
                                return null;
                            let month,count = "";
                            if(data.date) {
                                let timeSet = /^(\d{4})-(\d{2})/.exec(data.date);
                                month = `${timeSet[1]}년 ${timeSet[2]}월`;
                                count = data.state === 0 ? "없음" : <span className="mypage-modal-indexCountRed">{data.state + "번"}</span>
                            } else if(data.time) {
                                let times = /^([0-9]{1,})?시?\s*([0-9]{1,})?분?\s*\W*?\s*[출근|ㅊㄱ|외근|ㅇㄱ]/.exec(data.text)
                                let timeSet = /^\d{4}-\d{2}-\d{2}\s*(\d{2}):(\d{2}):\d{2}/.exec(data.time);
                                month = moment(data.time).format("YYYY. M. D (ddd)");
                                count = <span className="mypage-modal-indexCountRed">{(times[1] ? times[1] + "시" : timeSet[1] + "시 ") + (times[2] ? times[2] + "분" : timeSet[2] + "분")}</span>
                            }
                            return <div key={i} className="mypage-modal-index">
                                <div className="mypage-modal-indexDiv1">
                                    <span className="mypage-modal-indexMonth">{month}</span>
                                </div>
                                <div className="mypage-modal-indexDiv2">
                                    <span className="mypage-modal-indexCount">{count}</span>
                                </div>
                            </div>
                        })
                    }
                </div>
                <div className="mypage-modal-bot">
                    <span className="mypage-modal-left" onClick={this.arrowClick.bind(this,"left")}>&larr;</span>
                    <div className="mypage-modal-btns">
                        {modalBtn}
                    </div>
                    <span className="mypage-modal-right" onClick={this.arrowClick.bind(this,"right")}>&rarr;</span>
                </div>
            </div>
        </div>
    }
    // ------------------------------ rendering ------------------------------
    render() {
        const { holidayHistorys,holidayCount,mainClass } = this.state;        // 로드 마스크, 휴가 사용 내역, 오늘 날짜
        let setTimes = "";       // 휴가 사용 내역 중 오늘 날짜와 계산용
        let backgoundColors = "";
        const modals = this.modalContents();
        return (
            <div className={mainClass}>
                {
                    <div className="mypage-modal-parents">{modals}</div>
                }
                <div className="mypage-upDiv">
                    <div className="mypage-progDiv">
                        <span className="mypage-progSpan">내 현황</span>
                        <div className="mypage-progressBarDiv">
                            <div className="mypage-progressBarInner">
                                <img src="img/usa.png" alt="err" className="mypage-usa"></img>
                                <img src="img/usabottle.png" alt="err" className="mypage-usabottle"></img>
                                <span className="mypage-progressCountPlus">{}</span>
                                <span className="mypage-progressCount">{20-holidayCount}</span>
                                <span className="mypage-progressTopText">내 휴가</span>
                                <div className="mypage-progressMid">
                                    <span className="mypage-progressMidText1">{20-holidayCount}</span>
                                    <span className="mypage-progressMidText2">{}</span>
                                    <span className="mypage-progressMidText3"> /20</span>
                                    <div className="mypage-progressMidBottom"></div>
                                </div>
                                <span className="mypage-progressBotText">{holidayCount}번 사용했고 <b>{20-holidayCount}번{}</b> 남아있어요</span>
                            </div>
                        </div>
                    </div>
                    <div className="mypage-spans">
                        <span className="mypage-DashSpan">이번달에 나는 ... </span>
                        <div className="mypage-monthBtn">
                            <div className="mypage-circle"></div>
                            <span className="mypage-circleSpan">월평균</span>
                        </div>
                    </div>
                    <div className="mypage-DashDiv">
                        <MyDashboard classNameDash={"mypage-Dash1"} contents={this.tardyContents.bind(this)}/>
                        <MyDashboard classNameDash={"mypage-Dash2"} contents={this.avgAttenTimeContents.bind(this)}/>
                        <MyDashboard classNameDash={"mypage-Dash3"} contents={this.attenContents.bind(this)}/>
                        <MyDashboard classNameDash={"mypage-Dash4"} contents={this.nightShiftContents.bind(this)}/>
                    </div>
                </div>
                <div className="mypage-imgDiv">
                    <img src="img/ground.png" alt="err" className="mypage-imgNum3"></img>
                    <img src="img/cang.png" alt="err" className="mypage-imgNum2"></img>
                    <img src="img/castle.png" alt="err" className="mypage-imgNum1"></img>
                </div>
                <div className="mypage-downDiv">
                    <div className="mypage-downSpans">
                        <div className="mypage-downCircle"></div>
                        <span className="mypage-downSpan">휴가 사용 내역</span>
                    </div>
                    <div className="mypage-downDashDiv">
                        {   // 휴가 사용 내역 표시
                            holidayHistorys.map((data,i)=>{
                                setTimes = /(\d{4}-\d{2}-\d{2})/.exec(data.textTime);
                                if(/반차/.test(data.cate)) {
                                    backgoundColors = "#d6ff98";
                                } else if(/휴가/.test(data.cate)) {
                                    backgoundColors = "#87dffa";
                                } else if(/대휴/.test(data.cate)) {
                                    backgoundColors = "#b1c1ff";
                                } else if(/병가/.test(data.cate)) {
                                    backgoundColors = "#fddb87";
                                } else {
                                    backgoundColors = "#b4b4b4";
                                }
                                return <div key={i} className="mypage-downDashNum">
                                    <div className="mypage-downDashBox" style={{ backgroundColor: backgoundColors }}>
                                        <span className="mypage-downDashNumCate">{/반차/.test(data.cate) ? (/(반차)/.exec(data.cate))[1] : data.cate}</span>
                                    </div>
                                    <span>
                                        {
                                            moment(moment(new Date())).startOf('day').diff(moment(setTimes[1]).startOf('day'), 'days') < 0 ? 
                                            <span className="mypage-downDashNumBool">[예정]&nbsp;&nbsp;{data.textTime}</span> 
                                            : 
                                            <span className="mypage-downDashNumTime">{data.textTime}</span>
                                        }
                                    </span>
                                </div>
                            })
                        }
                    </div>
                </div>
            </div>
        );
    }
}

export default mypage;