'use strict'

const firebase = require('firebase')
require('firebase/firestore')

const config = {
  apiKey: '',
  authDomain: '',
  databaseURL: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: ''
}

const client = firebase.initializeApp(config)

firebase.auth().signInAnonymously()

const firestore = client.firestore()
firestore.settings({ timestampsInSnapshots: true })

// The chat client has two mode:
// Admin: listen for new chats, then show their contents, send messages
// User: start new chats with an Admin, send messages, update content

function adminMode(onNewChat) {
  const channels = firestore.collection('channels')

  channels.onSnapshot(qs =>
    qs.docChanges().forEach(({ doc }) => {
      const userId = doc.data().userId
      const thread = firestore.collection(
        ['channels', userId, 'thread'].join('/')
      )

      const onNewMessage = onNewChat(userId)
      thread.onSnapshot(qs =>
        qs.docChanges().forEach(({ doc }) => onNewMessage(doc.data()))
      )
    })
  )

  return function sendMessage(userId, message) {
    const thread = firestore.collection(
      ['channels', userId, 'thread'].join('/')
    )
    const addPromise = thread.add({ message, from: 'admin' })

    // eslint-disable-next-line no-console
    addPromise.then(console.log, console.log)
    return addPromise
  }
}

function userMode(userId, onNewMessage) {
  const thread = firestore.collection(['channels', userId, 'thread'].join('/'))

  thread.onSnapshot(qs =>
    qs.docChanges().forEach(({ doc }) => onNewMessage(doc.data()))
  )

  return function sendMessage(message) {
    const addPromise = thread.add({ message, from: userId })

    // eslint-disable-next-line no-console
    addPromise.then(console.log, console.log)
    return addPromise
  }
}

module.exports = {
  adminMode,
  userMode
}
