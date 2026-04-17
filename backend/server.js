require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');
const { getContact, createLog, updateLog, getLogs } = require('./database');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const VoiceResponse = twilio.twiml.VoiceResponse;

// Realistic Indian Voice Settings
const VOICE_NAME = 'Polly.Kajal'; // Neural voice for Hindi/English mix
const LANGUAGE = 'hi-IN';

// Helper to generate a human-like response
const generateTwiML = (text, isQuestion = false) => {
  const twiml = new VoiceResponse();
  const options = { voice: VOICE_NAME, language: LANGUAGE };
  
  if (isQuestion) {
      twiml.say(options, text);
  } else {
      twiml.say(options, text);
  }
  return twiml;
};

// Start of Call
app.post('/voice', async (req, res) => {
  const from = req.body.From;
  const twiml = new VoiceResponse();

  try {
    const contact = await getContact(from);
    const logId = await createLog(from, 'inbound');

    const greetingOptions = { voice: VOICE_NAME, language: LANGUAGE };

    if (contact && contact.is_vip) {
      // Direct forwarding for VIPs
      twiml.say(greetingOptions, "Namaste... VIP call detected. Forwarding.");
      twiml.dial("+919067693696"); // User's actual number
      await updateLog(logId, { call_status: 'forwarded-vip' });
    } else {
      // Natural pause before answering
      twiml.pause({ length: 1 });
      
      const gather = twiml.gather({
        numDigits: 1,
        action: `/gather?logId=${logId}`,
        method: 'POST',
        timeout: 5
      });
      
      if (contact && contact.name) {
        gather.say(greetingOptions, `Namaste`);
        gather.pause({ length: 1 });
        gather.say(greetingOptions, `Sahab is samay vyast hai. Main aapki sahayata kar sakti hoon.`);
      } else {
        gather.say(greetingOptions, `Namaste`);
        gather.pause({ length: 1 });
        gather.say(greetingOptions, `Aapke call ke liye dhanyavaad. Filhaal sahab vyast hai.`);
      }

      gather.pause({ length: 1 });
      gather.say(greetingOptions, `Kripya apna sandesh chodne ke liye ek dabaye`);
      gather.pause({ length: 1 });
      gather.say(greetingOptions, `ya agar aapko turant baat karni hai to do dabaye.`);
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error("Error in /voice:", error);
    twiml.say({ voice: VOICE_NAME, language: LANGUAGE }, "Maaf kijiye, ek samasya aayi hai.");
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Gather input
app.post('/gather', async (req, res) => {
  const digits = req.body.Digits;
  const logId = req.query.logId;
  const twiml = new VoiceResponse();
  const options = { voice: VOICE_NAME, language: LANGUAGE };

  try {
    if (digits === '1') {
      twiml.say(options, "Ji... kripya dhyan dein... aapka sandesh record kiya ja raha hai. Kripya bolna prarambh karein.");
      twiml.record({
        action: `/record?logId=${logId}`,
        method: 'POST',
        maxLength: 120,
        playBeep: true
      });
    } else if (digits === '2') {
      await updateLog(logId, { is_urgent: 1, call_status: 'forwarded-urgent' });
      twiml.say(options, "Kripya rukiye... main call connect kar rahi hoon.");
      twiml.dial("+919067693696"); // User's actual number
      io.emit('urgent_call', { logId, phoneNumber: req.body.From, timestamp: new Date() });
    } else {
      twiml.say(options, "Maaf kijiye... aapne galat option chuna hai. Kripya fir se try karein.");
      twiml.redirect('/voice');
    }
  } catch (error) {
    console.error("Error in /gather:", error);
    twiml.say(options, "Maaf kijiye, ek samasya aayi hai.");
  }
  
  res.type('text/xml');
  res.send(twiml.toString());
});

// Record voicemail
app.post('/record', async (req, res) => {
  const logId = req.query.logId;
  const recordingUrl = req.body.RecordingUrl;
  const twiml = new VoiceResponse();
  const options = { voice: VOICE_NAME, language: LANGUAGE };

  try {
    await updateLog(logId, { voicemail_url: recordingUrl, call_status: 'voicemail-saved' });
    io.emit('new_voicemail', { logId, url: recordingUrl, phoneNumber: req.body.From });

    twiml.say(options, "Dhanyavaad... aapka sandesh safalta se record ho gaya hai. Shubh din.");
    twiml.hangup();
  } catch (error) {
    console.error("Error in /record:", error);
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Dashboard APIs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await getLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
