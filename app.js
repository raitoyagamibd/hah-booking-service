const express = require('express');
const socketIo = require('socket.io');
const http = require('http');
const cors = require('cors');
const moment = require('moment');
const bodyParser = require('body-parser');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');
const admin = require('firebase-admin');

const AGORA_APP_ID = "09e6a43a1b57416685152ee0d8d0ffad";
const AGORA_APP_CERTIFICATE = "ab3e62ad090f42eab19fb449560d0cfc";



const serviceAccount = {
    type: "service_account",
    project_id: "projectgroupchat-7a78e",
    private_key_id: "6b4476d42cee4df35fae12e04c917b203389793e",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC2VTmDdibROU2Y\n+8hYigHrukI5Z4x3EsNkHML5IdyYS6JrxUSuUaBt40XxphAmQ4iJCgrQkopuHXO5\nPNZa6N4zWPsqvk2ZrOfdUkdVnXcx/0U3ic5li6HJhqOYsa8lqDoKnfm1bHDKIoN9\nreehivZQQJYR0EqvhDfYQ+BMZZEbyo8mLoql37sH1+HqEUQImnJl82maTq4kRK8X\nQbP3QYJlXJ6XCIHhpuXI1/t1JFcmcVdCwgLiieaahlALtyztTwR0EN5nObKUV5Xf\nHGyrhLoATSZLrra90KZ25uZzr5D/j5sjkjpDF1IvFpOBlIR1iwvLhsL2K1bLcu1o\naGqlqbf5AgMBAAECggEAFINABi8rrMwik7x3zKYyEyAQRT8GCXtd6gxmTvrlQ2j2\n6+L0mBvszZANFWOWW4ere6dakh56XmsH0uYqQ24BWYuALk3ckxZlu3t/NP2TJFfQ\npK/nPXtZB0ATdaE/0B+97+XX6vY5NjRt0JzY+06T6XFqsLRbQqXAVp9EQ7QFgDe4\nBgJ4O2q0fAZk0v1gMRZnuM7nHCA4pqFZT2mVXPZtTPAvNl7UxBAro9SbucDNufIA\nEMNcOuCqOYz3QXCl8oM4ZLEEm2rAn/+CH4k6AtBz9OHvVrlmlrXX48aWLRiu4OFk\nv/5QpmuUpq9s9+6nE/cazc4idyrJ2R3sA2zyX78wgQKBgQDcQO3amxwqtRCrrgYq\nafnC46AixOYidkdb2pEuuONzZEPgXSL0X2VCBwqEa7wphzXHtSNDbvqzxgjOpoSX\nlkm139brUzatbN30lcVcDKcCnL+tMON9iOOLvoz3xCc2RiJ6BlQgjbL9GZlF7JU6\nFpY4uYDYFDNNscUbGFSZ+Lyy6QKBgQDT7MUkFaJE/NAAZzrNAiciDBPg5BWABLkr\nWcFDkRSu89nbi99Dc7Xcsy0jNP+dpD30xiGumnNrAGfzRFrG83gQZXFI7cVsUd17\n9aZQioDYSwIp4e3vEq0OuEPrte0dzbqSFXZ3JxiaTxbjJhxRMIcUG0LYDaOycHSY\nqdVS5BQSkQKBgF52yozTscTvW3MGdEaEpUZc8jV3VWy6ZeiTWWk8ivDWs/XqfC9r\nKrai5nPc8RqujvZUTgeB9axc5zIaYQvSvVJv6nGLgwvmgVuBUOAl3QtVxy+0pB0X\nNOCenT82tcqlUewcAsDjhTzgWciPq4D6Zvt1NDl4kHhmIi94w/A1qljhAoGAAzvR\npkNOPo88/USV+RrXTgWxJ/VS/qkTyj2MXWORVToTUO5JcdYKKFvzjF36qIUhDOMZ\nEHj62d8ftu6MFA0S/+0MVXiLUqPNJV8SMphqbuJ2Hf18i/FVAqx9HNOh0pqZBjGd\npSPLlE8wojaqp/J9nSjtVC6hGM/ud4Xf42vngoECgYEAx4RqucuggBKMB/5c69oo\nsihOid09GEoVzUrrE02wo0HDakX4WHqVkYtXajWzLCGhs6QBRi353UDcgYh7Q7UQ\nF4HufwiX5lfdHi12VS16GCN56HW0sb28y+sDmKi4+1hT3EygnaWSirY5gTCgM8nZ\nTEKoJov7osg3xUlrV/1grGY=\n-----END PRIVATE KEY-----\n",
    client_email: "firebase-adminsdk-lq7lj@projectgroupchat-7a78e.iam.gserviceaccount.com",
    client_id: "106200974121606643891",
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-lq7lj%40projectgroupchat-7a78e.iam.gserviceaccount.com",
    universe_domain: "googleapis.com"
  }

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(cors({
    origin: '*'
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://projectgroupchat-7a78e.firebaseio.com",
});


const authenticateUser = async (req, res, next) => {
    try {
      const { authorization } = req.headers;
  
      if (!authorization || !authorization.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      const idToken = authorization.split('Bearer ')[1];
  
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.token = decodedToken;
  
      next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ error: 'Unauthorized' });
    }
  };

app.post('/api/search-doctors',authenticateUser, async (req, res) => {
    try {
      // Xử lý logic tìm kiếm bác sĩ
      await searchDoctors(req.body.timeStart, req.body.duration, req.body.userId, req.body.fmcToken);
      res.json({OK: true});
    } catch (error) {
      console.error(error);
      res.status(500).json({message: error.message});
    }
  });

  app.get('/', async (req, res) => {
    return res.json({
        status: 200,
        des: "đây là test"
    })
  });

app.post('/api/meeting-active', authenticateUser, async (req, res) =>{//req {meetingId,  }
  try{
    const meetRef = admin.firestore().collection('appointment').where('userid', '==', req.token.uid);
    const scheduleSnapshot = await meetRef.get();
    let meetingData;
    scheduleSnapshot.forEach(doc =>{
      doc.data().meetings.forEach(mtd => {
        if(mtd.meetingId === req.body.meetingId){
          const meetDate = moment(mtd.startDate, 'YYYY-MM-DD HH:mm').add(mtd.duration, 'minutes');
          const currentDate = moment();
          if(currentDate.isBefore(meetDate) && currentDate.isSameOrAfter(moment(mtd.startDate, 'YYYY-MM-DD HH:mm'))){
            meetingData = mtd;
          }
          return
        }
      })
    })
    
    if(!meetingData) return res.status(400).json({message: "thời gian hiện tại không nằm trong khung giờ cuộc hẹn!"})

    const channelName = req.body.meetingId;
    const role = RtcRole.PUBLISHER;
    const timeExpire = moment(meetingData.startDate, "YYYY-MM-DD HH:mm").add(meetingData.duration, 'minutes');
    const currentTime = Math.floor(Date.now() / 1000);
    const durationInSecond = currentTime + timeExpire.diff(moment(), "second");
    const token = RtcTokenBuilder.buildTokenWithUid(AGORA_APP_ID,AGORA_APP_CERTIFICATE, channelName,0 , role, durationInSecond);
    return res.status(200).json({
      appId: AGORA_APP_ID,
      token: token,
      channelName,
      timeOutSeconds: timeExpire.diff(moment(), "second")
    })
  }catch(error){
    res.status(500).json({message: error.message});
  }
})



  async function searchDoctors(date, duration, userId, userfmcToken) {
    const checkUserValid = await checkDoctorAppointment(userId,date,duration);
    if(!checkUserValid){
      throw new Error("Bạn đã có lịch hẹn trong khoảng thời gian này!");
    }
    // Lấy danh sách bác sĩ từ Firestore
    const doctorsRef = admin.firestore().collection('users').where('roles', '==', 'Doctor');
    const doctorsSnapshot = await doctorsRef.get();
    let doctors = [];

    doctorsSnapshot.forEach((doc) => {
      const doctor = doc.data();
      doctors.push(doctor);
    });
  
    //filter doctor
    
    const _doctors = await filterDoctorsBySchedule(date,doctors ,duration);
    if(_doctors.length === 0) {
      throw new Error("Không có bác sĩ trong khung giờ này");
    }
    //get dmc

    await handleSendMessage(date, duration,_doctors, userId,userfmcToken);

  }

  async function sendNotification(title, description, fmcToken, params = {}){
    const message = {
      notification: {
        title: title,
        body: description,
      },
      to: fmcToken,
      data: {
        ...params
      },
    };

    const serverKey = 'AAAA3U0G2bo:APA91bFVgStvNoPrKH0FIurk2q7_C6IW62p70vivmtm7INISnAYC_cCLcPiIOih7qT3oa-gOPbHrOOCDPRmSW43BTwAvFu8Wg08qlEsMS1TVDCl6MlQ_pYRHKMbg167YFQi0gkhWhdvW';
    const fcmUrl = 'https://fcm.googleapis.com/fcm/send';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${serverKey}`,
      },
      body: JSON.stringify(message),
    };
    await fetch(fcmUrl, options);
  }

  async function handleSendMessage(date, duration, doctors, userId, userfmcToken) {
    let fmcTokens = doctors.map((doctor) => doctor.fcmToken).filter(token => token !== undefined );

    const randomIndex = Math.floor(Math.random() * fmcTokens.length);
    const fmcToken = fmcTokens[randomIndex];
    
    const clientId = Date.now().toString();
    await sendNotification('Thông báo',  "Bạn có một yêu cầu cuộc họp từ khách hàng vào " + date + " trong "+ duration + " phút", fmcToken,{notificationType: "Booking", key: clientId})
      //if success
      const socket = io.of(`/${clientId}`);
      const timeout = 30.0;
      let remainingTime = timeout;
      let isConnected = false;
      let tick = false;
      const timerId = setInterval(() => {
        remainingTime-=0.1;
        
        if (remainingTime < 0 || isConnected) {
          clearInterval(timerId);
        }
      }, 100);
      
      socket.on('connection', (socket) => {
        console.log(`Kết nối Socket.IO đã được thiết lập với client ${clientId}`);
        isConnected = true;
        // Xử lý sự kiện nhận tin nhắn từ client
        socket.on('message', async (message)  => {
          console.log(`Nhận được tin nhắn từ client ${clientId}:`, message);
          tick = true;
          if(message === 0){//reject
            if(fmcTokens.length > 1){
              fmcTokens.splice(randomIndex, 1);
              await handleSendMessage(date, duration, fmcTokens, userId, userfmcToken);
            }else{
              sendNotification(`thông báo`, `Không có bác sĩ nào chấp nhận, hãy thử đặt lại khung giờ khác nhé!`,userfmcToken, {notificationType: "ConfirmBooking"});
            }
          }else{
            
            const meetRef = admin.firestore().collection('appointment').where('userid', '==', doctors[randomIndex].uid);
            const scheduleSnapshot = await meetRef.get();
  
            await scheduleSnapshot.forEach(async (doc) => {
              const meetingsData = doc.data().meetings;
              const data = {
                meetingId: clientId,
                startDate: date,
                duration: duration
              }
              meetingsData.push(data);
              await doc.ref.update({
                meetings: meetingsData
              });
            })    
            const meetReU = admin.firestore().collection('appointment').where('userid', '==', userId);
            const scheduleSnapshotU = await meetReU.get();
  
            await scheduleSnapshotU.forEach(async (doc) => {
              const meetingsData = doc.data().meetings;
              const data = {
                meetingId: clientId,
                startDate: date,
                duration: duration
              }
              meetingsData.push(data);
              await doc.ref.update({
                meetings: meetingsData
              });
            }) 
            sendNotification(`thông báo`, `Bạn có cuộc hợp với bác sĩ vào ${date} trong ${duration} phút, đừng bỏ lỡ nhé!`,userfmcToken, {notificationType: "ConfirmBooking"});
          }
          socket.disconnect();
        });
         // Thời gian timeout (giây)

        // Gửi thời gian còn lại tới client mỗi giây
        if(remainingTime< 0){
          socket.disconnect();
        }else{
          const timerId = setInterval(() => {
            socket.emit('timer', remainingTime);
          
            remainingTime-=0.1;
          
            if (remainingTime < 0) {
              clearInterval(timerId);
              socket.disconnect();
            }
          }, 100);
        }
        
        // Xử lý sự kiện đóng kết nối
        socket.on('disconnect', async () => {
          console.log(`Kết nối của client ${clientId} đã đóng`);
          // Xóa kết nối khi client đóng kết nối
          clearInterval(timerId);
          if(!tick){
            if(fmcTokens.length > 1){
              fmcTokens.splice(randomIndex, 1);
              await handleSendMessage(date, duration, fmcTokens, userId, userfmcToken);
            }else{
              sendNotification(`thông báo`, `Không có bác sĩ nào chấp nhận, hãy thử đặt lại khung giờ khác nhé!`,userfmcToken, {notificationType: "ConfirmBooking"});
            }
          }
        });
      });
  }


  async function filterDoctorsBySchedule(startDate, doctors, duration) {
    try {
      const filteredDoctors = [];
  
      for (const doctor of doctors) {
        const scheduleRef = admin.firestore().collection('schedule').where('userid', '==', doctor.uid);
        const scheduleSnapshot = await scheduleRef.get();
  
        await scheduleSnapshot.forEach(async (doc) => {
          const scheduleData = doc.data();
  
          // Kiểm tra ngày trong tuần
          const startDateTime =  moment(startDate, 'YYYY-MM-DD HH:mm');
          const dayOfWeek = startDateTime.format('dddd');
          const workingHours = scheduleData[dayOfWeek];

          if (workingHours && workingHours.length > 0) {
            await workingHours.forEach(async (workingHour) => {
              const workingStartTime = moment(workingHour.startTime, 'h:mm A');
              const workingEndTime = moment(workingHour.endTime, 'h:mm A');

              const workingStartDateTime = moment(startDateTime).set({
                hour: workingStartTime.hours(),
                minute: workingStartTime.minutes(),
              });
    
              const workingEndDateTime = moment(startDateTime).set({
                hour: workingEndTime.hours(),
                minute: workingEndTime.minutes(),
              });
    
          if (startDateTime.isSameOrAfter(workingStartDateTime) && startDateTime.isBefore(workingEndDateTime)) {
            const endDateTime = moment(startDateTime).add(duration, 'minutes');

            if (endDateTime.isSameOrBefore(workingEndDateTime)) {
              const check = await checkDoctorAppointment(doctor.uid, startDate, duration)
              if(check)
                filteredDoctors.push(doctor);
            }
          }
            });
          }
        });
      }
  
      return filteredDoctors;
    } catch (error) {
      console.error('Error filtering doctors:', error);
      return [];
    }
  }

async function checkDoctorAppointment(doctorId, startDate, duration) {
    const meetRef = admin.firestore().collection('appointment').where('userid', '==', doctorId);
    const scheduleSnapshot = await meetRef.get();
    let check = false;
    if(scheduleSnapshot){
      scheduleSnapshot.forEach(t => {
      const meetingsData = t.data().meetings;
      if((meetingsData && meetingsData.length == 0) || !meetingsData) {
        check = true;
        return;
      }
      meetingsData.forEach(m => {
        //m.startDate, m.duration
        const startDateTime =  moment(startDate, 'YYYY-MM-DD HH:mm');
        const endDateTime = startDateTime.clone().add(duration, "minutes");
        const doctorStartDateTime = moment(m.startDate, 'YYYY-MM-DD HH:mm');
        const doctorEndDateTime = doctorStartDateTime.clone().add(duration, "minutes");
        if(startDateTime.isAfter(doctorEndDateTime) || endDateTime.isBefore(doctorStartDateTime)){
          check = true;
          return;
        }
        return false;
      })
    })
    }
    return check
}

const PORT = process.env.PORT || 3000;
  
server.listen(PORT, (error) =>{
    if(!error){
        console.log("Server is Successfully Running, and App is listening on port "+ PORT)
    }else 
        console.log("Error occurred, server can't start", error);
    }
);

