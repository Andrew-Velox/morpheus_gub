// backend/bot.js
// Discord office assistant bot.
//Consumes the live backend REST API (http://localhost:PORT/api/*) and
// turns the raw device/usage data into friendly replies via Groq LLM.

import { Client, GatewayIntentBits } from 'discord.js';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE = `http://localhost:${process.env.PORT || 4000}/api`;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Groq LLM client for humanizing raw JSON into natural replies.
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- API client ------------------------------------------------------------
// Thin wrappers around fetch() with graceful fallback if the backend is down.

async function fetchJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function getStatus() {
  return fetchJSON('/status');
}

async function getUsage() {
  return fetchJSON('/usage');
}

async function getRoom(name) {
  // Encode so spaces / special chars survive the URL (e.g. "Work Room 1").
  return fetchJSON(`/room/${encodeURIComponent(name)}`);
}

// Summarize a room's devices into a compact counts object for the LLM
// (fewer tokens, friendlier than dumping 5 raw device objects).
function summarizeRoom(devices) {
  let fansOn = 0, lightsOn = 0, fansOff = 0, lightsOff = 0;
  for (const d of devices) {
    if (d.type === 'fan')   d.status ? fansOn++   : fansOff++;
    if (d.type === 'light') d.status ? lightsOn++ : lightsOff++;
  }
  return { fans_on: fansOn, lights_on: lightsOn, fans_off: fansOff, lights_off: lightsOff };
}

// --- LLM humanizer ---------------------------------------------------------

async function humanizeResponse(systemContext, rawData) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful, conversational office assistant bot.
            The boss hates robotic data dumps. Turn the provided JSON or raw
            device status data into a friendly, natural reply. Keep it concise
            but professional.`,
        },
        {
          role: 'user',
          content: `Context: ${systemContext}\nRaw Data: ${JSON.stringify(rawData)}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
    });

    return chatCompletion.choices[0]?.message?.content || 'no response generated.';
  } catch (error) {
    console.error('ai error:', error);
    return `beep boop! my ai circuits are jammed. here is the raw data instead: ${JSON.stringify(rawData)}`;
  }
}

// --- Discord events --------------------------------------------------------

async function startAlertListener() {
  const alertChannelId = process.env.DISCORD_ALERT_CHANNEL_ID;
  if (!alertChannelId) {
    console.log('🤖 alert channel ID not configured. proactive alerts disabled.');
    return;
  }

  console.log(`🤖 proactive alerts active. listening for anomalies to push to channel: ${alertChannelId}`);

  const streamUrl = `${API_BASE}/stream`;
  let lastAlertKeys = new Set();

  while (true) {
    try {
      const res = await fetch(streamUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep partial line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const snapshot = JSON.parse(line.slice(6));
              const currentAlerts = snapshot.alerts || [];
              const currentKeys = new Set();

              for (const alert of currentAlerts) {
                // Generate a unique key for tracking
                const key = alert.device_id
                  ? `${alert.type}:${alert.device_id}`
                  : `${alert.type}:${alert.room}`;

                currentKeys.add(key);

                // If this is a new alert, alert the channel!
                if (!lastAlertKeys.has(key)) {
                  console.log(`🤖 new alert detected: ${alert.message}`);
                  const formattedMsg = await humanizeResponse(
                    `Proactive alert warning message for the channel. Alert details: ${alert.message}`,
                    alert
                  );

                  try {
                    const channel = await client.channels.fetch(alertChannelId);
                    if (channel && typeof channel.send === 'function') {
                      await channel.send(`⚠️ **ALERT**: ${formattedMsg}`);
                    }
                  } catch (sendErr) {
                    console.error('Failed to send alert to Discord channel:', sendErr.message);
                  }
                }
              }

              lastAlertKeys = currentKeys;
            } catch (e) {
              console.error('Failed to parse SSE line:', e);
            }
          }
        }
      }
    } catch (err) {
      console.error('Alert listener SSE connection error, retrying in 5 seconds...', err.message);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

client.once('ready', () => {
  console.log(`🤖 bot is online as ${client.user.tag} and ready to test with groq!`);
  startAlertListener();
});

client.on('messageCreate', async (message) => {
  // Ignore other bots and messages without the '!' prefix.
  if (message.author.bot || !message.content.startsWith('!')) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  try {
    // !status -- full office status, grouped by room.
    if (command === 'status') {
      let data;
      try {
        const rooms = await getStatus();
        // Compact each room to counts so the LLM gets a tidy summary.
        const summary = {};
        for (const [room, devices] of Object.entries(rooms)) {
          summary[room] = summarizeRoom(devices);
        }
        data = summary;
      } catch (err) {
        console.error('api /status failed:', err.message);
        return message.reply('⚠️ can\'t reach the office backend right now. is `server.js` running?');
      }

      const reply = await humanizeResponse('Overall office device status report request.', data);
      return message.reply(reply);
    }

    // !room [name] -- a specific room's live status + power draw.
    if (command === 'room') {
      const roomName = args.join(' ');
      if (!roomName) {
        return message.reply('please specify a room! (e.g., `!room work1` or `!room Work Room 1`)');
      }

      let data;
      try {
        data = await getRoom(roomName);
      } catch (err) {
        console.error('api /room failed:', err.message);
        return message.reply(`⚠️ couldn't find room "${roomName}". try: work1, work2, or draw.`);
      }

      const summary = {
        room: data.room,
        ...summarizeRoom(data.devices),
        power_draw_watts: data.power_draw_watts,
      };
      const reply = await humanizeResponse(`Status report request for specific room: ${roomName}.`, summary);
      return message.reply(reply);
    }

    // !usage -- total + per-room power consumption.
    if (command === 'usage') {
      let data;
      try {
        data = await getUsage();
      } catch (err) {
        console.error('api /usage failed:', err.message);
        return message.reply('⚠️ can\'t reach the office backend right now. is `server.js` running?');
      }

      const reply = await humanizeResponse('Office power consumption and energy usage report.', data);
      return message.reply(reply);
    }
  } catch (error) {
    console.error('command error:', error);
    message.reply('sorry, hit a snag during testing.');
  }
});

client.login(process.env.DISCORD_TOKEN);