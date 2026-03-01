const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

// قاعدة البيانات (الكلمات الـ 300 العراقية المضبوطة)
const db = {
    animals: [
        "بزونة", "عتوي", "جلب", "طلي", "هايشة", "صخلة", "مطي", "زمال", "حصان", "ديج",
        "دجاجة", "كتكوت", "بطة", "وزة", "طير", "حمامة", "زرزور", "فاختة", "بلبل", "ببغاء",
        "عصفور", "فارة", "جريذي", "ارنب", "ركة", "سلحفاة", "عكروك", "حية", "عقرب", "عنكبوت",
        "ذبانة", "بقة", "خنفسانة", "صرصور", "نملة", "دودة", "فراشة", "جرادة", "زنبور", "قملة",
        "اسد", "نمر", "فهد", "ذيب", "واوي", "ضبع", "ثعلب", "خنزير", "دب", "فيل",
        "قرد", "سعدان", "غوريلا", "زرافة", "غزال", "جمل", "بعير", "ناقة", "ثور", "بقرة",
        "عجل", "جاموسة", "نعجة", "كبش", "جدي", "تيس", "ماعز", "بغل", "مهرة", "خفاش",
        "سنجاب", "قنفذ", "كنغر", "باندا", "كوالا", "تمساح", "حوت", "قرش", "دولفين", "سمجة",
        "اخطبوط", "فقمة", "سلطعون", "نعامة", "طاووس", "صقر", "نسر", "بومة", "غراب", "لقلق",
        "نورس", "بطريق", "هدهد", "بجعة", "ابو بريص", "ديناصور", "برغوث", "سحلية", "حلزون", "شبوط"
    ],
    objects: [
        "ميز", "كرسي", "قنفة", "تخم", "زولية", "بردة", "جرباية", "كنتور", "مخدة", "دوشك",
        "بطانية", "لحاف", "بنكة", "مبردة", "سبلت", "صوبة", "تلفزيون", "ريموت", "ثلاجة", "مجمدة",
        "غسالة", "طباخ", "قنينة", "صوندة", "ماطور", "تانكي", "بوري", "حنفية", "شطافة", "ماسحة",
        "مكناسة", "وصلة", "خاولي", "ليفة", "صابونة", "شامبو", "معجون", "فرشة", "مشط", "مراية",
        "سيارة", "بايسكل", "ستوتة", "تريلة", "طيارة", "سفينة", "قطار", "بلم", "ماوس", "كيبورد",
        "شاشة", "لابتوب", "موبايل", "سماعة", "شاحنة", "باتري", "واير", "بلك", "كلوب", "شمعة",
        "جطل", "خاشوكة", "سجينة", "كلاص", "استكان", "قوري", "كتلي", "صينية", "جدر", "طاوة",
        "ماعون", "كاسة", "دلة", "تنور", "مهفة", "علاكة", "قوطية", "بطل", "سويج", "قفل",
        "محبس", "تراجي", "قلادة", "سوار", "ساعة", "مناظر", "شفقة", "حذاء", "قندرة", "نعال",
        "جواريب", "قميص", "بنطلون", "تشاكيت", "دشداشة", "عباية", "جنطة", "جزدان", "قلم", "دفتر"
    ],
    food: [
        "دولمة", "برياني", "مقلوبة", "تمن", "مركة", "تشريب", "باجة", "قوزي", "مطبك", "كباب",
        "تكة", "معلاك", "كص", "فلافل", "كبة", "بورك", "مسكوف", "لفة", "شاورما", "لحم",
        "شوربة", "زلاطة", "طرشي", "عمبة", "كتشب", "مايونيز", "خبز", "صمون", "كاهي", "قيمر",
        "بيض", "جبن", "زبد", "دهن", "راشي", "دبس", "عسل", "مربى", "حليب", "لبن",
        "جاي", "كهوة", "عصير", "شربت", "مي", "بيبسي", "سفن", "موطة", "كيكة", "بسكت",
        "نستلة", "جكليت", "حلاوة", "بقلاوة", "زلابية", "داطلي", "كليجة", "تفاح", "برتقال", "موز",
        "ركي", "بطيخ", "عنب", "رمان", "خوخ", "مشمش", "عرموط", "تين", "تمر", "فراولة",
        "كيوي", "كرز", "توت", "طماطة", "خيار", "بصل", "ثوم", "بتيتة", "باذنجان", "شجر",
        "فلفل", "جزر", "خس", "قرنابيط", "لهانة", "شلغم", "شونذر", "كرفس", "فجل", "نعناع",
        "ريحان", "طحين", "عدس", "باكلة", "فاصوليا", "باميا", "لبلبي", "حمص", "اندومي", "شامية"
    ]
};
db.random = [...db.animals, ...db.food, ...db.objects];

const normalizeWord = (text) => text ? text.trim().replace(/ة/g, 'ه').replace(/[أإآ]/g, 'ا').replace(/\s+/g, ' ') : "";

// تخزين بيانات الغرف
const roomsData = {}; 
// تخزين الجلسات حتى نرجع اللاعب إذا سوى Refresh
const sessions = {}; 

io.on('connection', (socket) => {
    
    // 1. نظام استرجاع الجلسة (Reconnection)
    socket.on('reconnect user', (data) => {
        const { room, sessionId, peerId } = data;
        if (roomsData[room] && sessions[sessionId]) {
            let playerIndex = roomsData[room].players.findIndex(p => p.sessionId === sessionId);
            if (playerIndex !== -1) {
                // تحديث بيانات اللاعب بالاتصال الجديد
                roomsData[room].players[playerIndex].id = socket.id;
                roomsData[room].players[playerIndex].peerId = peerId;
                roomsData[room].players[playerIndex].connected = true;
                
                socket.join(room);
                socket.emit('reconnect success', { roomInfo: roomsData[room], me: roomsData[room].players[playerIndex] });
                io.to(room).emit('update players list', roomsData[room]);
                socket.to(room).emit('system message', `🔄 ${roomsData[room].players[playerIndex].name} رجع للروم!`);
                return;
            }
        }
        socket.emit('reconnect failed');
    });

    // 2. دخول لاعب جديد للروم
    socket.on('join room', (data) => {
        socket.join(data.room);
        
        if (!roomsData[data.room]) {
            roomsData[data.room] = { players: [], adminId: socket.id, maxPoints: data.maxPoints || 5, active: false, playerA: null, playerB: null, overallWinner: null };
        }
        
        // توليد ID سري للجلسة
        const sessionId = Math.random().toString(36).substring(2, 15);
        const newPlayer = { id: socket.id, sessionId: sessionId, name: data.name, avatar: data.avatar, score: 0, winStreak: 0, role: 'player', connected: true, peerId: data.peerId };
        
        roomsData[data.room].players.push(newPlayer);
        sessions[sessionId] = newPlayer; // حفظ الجلسة

        socket.emit('session saved', sessionId); // إرسال الجلسة للمتصفح حتى يحفظها
        socket.to(data.room).emit('system message', `🌟 ${data.name} دخل للروم!`);
        socket.to(data.room).emit('user-connected', { peerId: data.peerId });
        io.to(data.room).emit('update players list', roomsData[data.room]);
        socket.to(data.room).emit('play sound', 'join');
    });

    // 3. الخروج الطوعي من الروم (زر الرجوع للرئيسية)
    socket.on('leave room', (data) => {
        const { room, sessionId } = data;
        if (roomsData[room]) {
            let index = roomsData[room].players.findIndex(p => p.sessionId === sessionId);
            if (index !== -1) {
                let playerName = roomsData[room].players[index].name;
                roomsData[room].players.splice(index, 1);
                delete sessions[sessionId];
                
                socket.leave(room);
                io.to(room).emit('system message', `👋 ${playerName} غادر الروم.`);
                
                // نقل الآدمن إذا الآدمن طلع
                if (socket.id === roomsData[room].adminId && roomsData[room].players.length > 0) {
                    roomsData[room].adminId = roomsData[room].players[0].id;
                    io.to(room).emit('system message', `👑 تم تعيين آدمن جديد تلقائياً!`);
                }
                io.to(room).emit('update players list', roomsData[room]);
            }
        }
    });

    socket.on('speaking status', (data) => io.to(data.room).emit('update speaking status', { userId: socket.id, isSpeaking: data.isSpeaking }));

    // 4. صلاحيات الآدمن
    socket.on('kick player', (data) => {
        if (roomsData[data.room] && roomsData[data.room].adminId === socket.id) {
            let p = roomsData[data.room].players.find(x => x.id === data.targetId);
            if(p) {
                io.to(data.targetId).emit('kicked');
                io.to(data.room).emit('system message', `🥾 الآدمن طرد ${p.name}!`);
                // راح يتم مسحه تلقائياً من خلال دالة الـ disconnect
            }
        }
    });

    socket.on('transfer admin', (data) => {
        if (roomsData[data.room] && roomsData[data.room].adminId === socket.id) {
            roomsData[data.room].adminId = data.targetId;
            io.to(data.room).emit('update players list', roomsData[data.room]);
            io.to(data.room).emit('system message', `👑 تم نقل القيادة إلى لاعب جديد!`);
        }
    });

    socket.on('toggle spectator', (data) => {
        if (roomsData[data.room] && roomsData[data.room].adminId === socket.id) {
            let p = roomsData[data.room].players.find(x => x.id === data.targetId);
            if(p) { p.role = p.role === 'spectator' ? 'player' : 'spectator'; io.to(data.room).emit('update players list', roomsData[data.room]); }
        }
    });

    socket.on('update max points', (data) => {
        if (roomsData[data.room] && roomsData[data.room].adminId === socket.id) {
            roomsData[data.room].maxPoints = data.newPoints;
            io.to(data.room).emit('update players list', roomsData[data.room]);
        }
    });

    socket.on('send reaction', (data) => io.to(data.room).emit('show reaction', { emoji: data.emoji, x: Math.random() * 80 + 10 }));

    // 5. نظام اللعب
    socket.on('start game', (data) => {
        let roomInfo = roomsData[data.room];
        if (roomInfo) {
            let activePlayers = roomInfo.players.filter(p => p.role === 'player' && p.connected);
            if (activePlayers.length >= 2) {
                if(roomInfo.overallWinner) { roomInfo.overallWinner = null; roomInfo.players.forEach(p => p.score = 0); }
                let shuffled = [...activePlayers].sort(() => 0.5 - Math.random());
                let currentCategoryWords = db[data.category || 'random'];
                
                let wordA = currentCategoryWords[Math.floor(Math.random() * currentCategoryWords.length)];
                let wordB = currentCategoryWords[Math.floor(Math.random() * currentCategoryWords.length)];
                while(wordA === wordB) wordB = currentCategoryWords[Math.floor(Math.random() * currentCategoryWords.length)];

                roomInfo.playerA = { id: shuffled[0].id, name: shuffled[0].name, word: wordA, avatar: shuffled[0].avatar };
                roomInfo.playerB = { id: shuffled[1].id, name: shuffled[1].name, word: wordB, avatar: shuffled[1].avatar };
                roomInfo.active = true;

                io.to(data.room).emit('game started', { playerA: roomInfo.playerA, playerB: roomInfo.playerB, categoryName: data.category });
            } else { socket.emit('system message', "❌ لازم اكو لاعبين (2) متصلين مو متفرجين حتى تبدأ!"); }
        }
    });

    socket.on('submit guess', (data) => {
        let roomInfo = roomsData[data.room];
        if (!roomInfo || !roomInfo.active) return;
        let isPlayerA = socket.id === roomInfo.playerA.id;
        let isPlayerB = socket.id === roomInfo.playerB.id;
        
        if (isPlayerA || isPlayerB) {
            let correctWord = isPlayerA ? roomInfo.playerA.word : roomInfo.playerB.word;
            if (normalizeWord(data.guess) === normalizeWord(correctWord)) {
                let playerIndex = roomInfo.players.findIndex(p => p.id === socket.id);
                roomInfo.players[playerIndex].score += 1;
                roomInfo.players[playerIndex].winStreak += 1;
                
                let loserId = isPlayerA ? roomInfo.playerB.id : roomInfo.playerA.id;
                let loserIndex = roomInfo.players.findIndex(p => p.id === loserId);
                if(loserIndex !== -1) roomInfo.players[loserIndex].winStreak = 0;

                roomInfo.active = false;
                let isWinner = roomInfo.players[playerIndex].score >= roomInfo.maxPoints;
                if(isWinner) roomInfo.overallWinner = roomInfo.players[playerIndex].id;

                io.to(data.room).emit('round over', { winnerName: data.name, winnerId: socket.id, word: correctWord, isFinalWin: isWinner });
                io.to(data.room).emit('update players list', roomInfo);
                io.to(data.room).emit('play sound', 'win');
            } else {
                io.to(data.room).emit('wrong guess', { name: data.name, guess: data.guess });
                io.to(data.room).emit('play sound', 'lose');
            }
        }
    });

    socket.on('chat message', (data) => {
        let roomInfo = roomsData[data.room];
        let msg = data.msg;
        if (roomInfo && roomInfo.active) {
            let smartMsg = normalizeWord(msg), smartWordA = normalizeWord(roomInfo.playerA?.word), smartWordB = normalizeWord(roomInfo.playerB?.word);
            if (smartMsg.includes(smartWordA) || smartMsg.includes(smartWordB)) msg = "🚫 [حاول يغشش وانكشف!]";
        }
        io.to(data.room).emit('chat message', { name: data.name, avatar: data.avatar, msg: msg });
        socket.to(data.room).emit('play sound', 'msg');
    });

    // 6. عند انقطاع الاتصال (اللاعب يفصل)
    socket.on('disconnect', () => {
        for (let room in roomsData) {
            let index = roomsData[room].players.findIndex(p => p.id === socket.id);
            if (index !== -1) {
                // ما نمسحه فوراً، بس نأشر عليه "غير متصل" حتى نعطيه فرصة يرجع إذا سوى Refresh
                roomsData[room].players[index].connected = false;
                io.to(room).emit('update players list', roomsData[room]);
                
                // راح ننتظر 15 ثانية، إذا ما رجع (يعني صدك طلع)، نمسحه من الروم
                setTimeout(() => {
                    if (roomsData[room] && roomsData[room].players[index] && !roomsData[room].players[index].connected) {
                        let sessionId = roomsData[room].players[index].sessionId;
                        delete sessions[sessionId];
                        
                        if(socket.id === roomsData[room].adminId && roomsData[room].players.length > 1) {
                            let nextAdmin = roomsData[room].players.find(p => p.connected);
                            if(nextAdmin) roomsData[room].adminId = nextAdmin.id;
                        }
                        
                        roomsData[room].players.splice(index, 1);
                        io.to(room).emit('update players list', roomsData[room]);
                    }
                }, 15000); // 15 ثانية سماحية
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server is running on port ${PORT}..`));