#!/usr/bin/env node

import chalk from 'chalk';
import ytdl from 'ytdl-core';
import Speaker from 'speaker';
import ffmpeg from 'fluent-ffmpeg';
import inquirer from 'inquirer';
import { path } from '@ffmpeg-installer/ffmpeg';
import cliSpinners from 'cli-spinners';
import ora from 'ora';
// @ts-ignore
import lame from '@suldashi/lame';
import Volume from 'pcm-volume'
import cliProgress from 'cli-progress';
// @ts-ignore
import keypress from 'keypress';
import readline from 'readline';

ffmpeg.setFfmpegPath(path);


let url = 'https://www.youtube.com/watch?v=tVCUAXOBF7w';

async function welcome() {
  console.clear();

  await inquirer
    .prompt([
      {
        type: 'input',
        name: 'url',
        message: 'Enter video url: ',
      },
    ])
    .then((answer) => {
      url = answer.url
    });

  console.clear()
}

const decoder = new lame.Decoder({
  channels: 2,
  sampleRate: 44100,
  outSampleRate: 48000,
});

// Create a volume instance
const volume = new Volume();

const speaker = new Speaker({
  channels: 2,          // 2 channels
  bitDepth: 16,         // 16-bit samples
  sampleRate: 48000,     // 44,100 Hz sample rate
});


volume.pipe(speaker); // pipe volume to speaker
decoder.pipe(volume); // pipe PCM data to volume

async function handleView () {
  const stream = ytdl(url, { filter: 'audioonly' })

  stream.on('info', ({ videoDetails }) => {
    ora({ spinner: cliSpinners.balloon, text: chalk.bgBlack(`Currently playing: \n${videoDetails.title}`)}).start();
  });


  ffmpeg(stream)
  .format('mp3')
  .pipe(decoder)
  // .on('data', () => {
  //   console.log('data coming');
  // })

  // renderButtons()
}

const _ = '♪';

let currentButtonIndex = 1;
let currentVolume = 1;

function controlVolume(action: string) {
  console.log(`volume ${action}`)
  if (action === 'increase' && currentVolume < 1) {
    currentVolume -= 0.2;
  } else if (action === 'increase' && currentVolume > 0) {
    currentVolume += 0.2;
  }
  volume.setVolume(currentVolume)
}

const buttons = [
  // '⇆',
  { icon: '◃', action: () => { console.log('prev') }},
  {icon: chalk.bold('||'), action: () => { console.log('pause') }},
  { icon: '▹', action: () => { console.log('next') }},
  // '↻',
  {icon: '♫ (+)', action: () => controlVolume('increase')},
  {icon: '(-)', action: () => controlVolume('decrease')},
]

function renderButtons() {
  console.clear()

  console.log(buttons.map(({ icon }, index) => {
    if (index === currentButtonIndex) {
      return chalk.cyan(icon)
    }
    return icon
  }).join(' '))
}

readline.emitKeypressEvents(process.stdin);

process.stdin.setRawMode(true);

let debug = false;


// await welcome();
await handleView();
// renderButtons()

process.stdin.on('keypress', (_, key) => {
  if (key.name === 'z') {
    debug = true;
  }

  if(key.ctrl && key.name == "c") {
    process.exit(0)
  }
  if (key.name === 'right' && currentButtonIndex < 4) {
    currentButtonIndex++;
  } else if (key.name === 'left' && currentButtonIndex > 0) {
    currentButtonIndex--;
  }

  if (key.name === 'space') {
    buttons[currentButtonIndex].action()
  }
  renderButtons()
});
