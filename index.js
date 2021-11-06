const cron = require('node-cron')

const fs = require('fs')
const util = require('util')
const path = require('path')

require('dotenv').config({path: path.join(__dirname, '.env')})

const log = (...msg) => {
  const message = `[${new Date().toISOString()}] ${util.format(...msg)}`
  console.log(message)
}

log(`Process started with id ${process.pid}`)

process.on('uncaughtException', (err) => {
  log('[ERROR]', err)
})

const Alexa = require('ask-sdk-core')
const { SkillMessagingServiceClient } =
  require('ask-sdk-model').services.skillMessaging

const addToDoTask = async (taskName, taskComplete = false) => {
  const {
    CLIENT_ID: clientId,
    CLIENT_SECRET: clientSecret,
    USER_ID: userId,
  } = process.env

  const apiConfiguration = {
    apiClient: new Alexa.DefaultApiClient(),
    apiEndpoint: 'https://api.amazonalexa.com',
  }

  const authenticationConfiguration = {
    clientId,
    clientSecret,
  }

  const messagingClient = new SkillMessagingServiceClient(
    apiConfiguration,
    authenticationConfiguration
  )

  const message = {
    data: {
      value: taskName,
      status: taskComplete ? 'completed' : 'active',
    },
  }

  await messagingClient.sendSkillMessage(userId, message)
}

const tasks = require('./tasks.json')

const replacements = {
  midnight: '0 0',
  noon: '0 12',
}

Object.entries(tasks).forEach(([task, schedule]) => {
  Object.entries(replacements).forEach(([find, replace]) => {
    schedule = schedule.replace(find, replace)
  })
  cron.schedule(
    schedule,
    () => {
      log(`Adding task "${task}"`)
      addToDoTask(`- ${task}`)
    }
  )

  log(`Scheduled task "${task}"`)
})
