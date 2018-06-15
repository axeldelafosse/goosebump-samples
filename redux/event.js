import axios from 'axios'
import RNAmplitute from 'react-native-amplitude-analytics'
const amplitude = new RNAmplitute('c9840ed64b0d43fbabc19b5115f9304d')

// ------------------------------------
// Constants
// ------------------------------------
export const EVENT_REQUEST = 'EVENT_REQUEST'
export const EVENT_INTERESTED = 'EVENT_INTERESTED'
export const EVENT_GOING = 'EVENT_GOING'
export const EVENT_SHARE = 'EVENT_SHARE'
export const EVENT_TICKETS = 'EVENT_TICKETS'
export const EVENT_SUCCESS = 'EVENT_SUCCESS'
export const EVENT_FAILURE = 'EVENT_FAILURE'
export const EVENT_FRIENDS_GOING = 'EVENT_FRIENDS_GOING'
export const EVENT_SIMILARS = 'EVENT_SIMILARS'

// ------------------------------------
// Actions
// ------------------------------------

// we're attempting to fetch event
export const eventRequest = (eventId, userId) => (dispatch, getState) => {
  dispatch({ type: EVENT_REQUEST })
  if (!userId) {
    const state = getState()
    if (state.user && state.user.id) userId = state.user.id
  }
  if (userId) {
    amplitude.logEvent('app_event', { eventId })
  }
  return axios
    .get('https://api.goosebump.com/event', {
      params: {
        eventId,
        userId
      }
    })
    .then(response => {
      if (userId) {
        axios
          .get('https://alakazam.goosebump.com:4242/friendsGoing', {
            params: {
              eventId,
              userId
            }
          })
          .then(response => {
            dispatch(eventFriendsGoing(response.data))
          })
          .catch(error => {
            console.log(error)
          })
      }
      axios
        .get('https://mewtwo.goosebump.com:42420/similars', {
          params: {
            eventId
          }
        })
        .then(response => {
          if (userId && response.data && response.data.length !== 0) {
            axios
              .get('https://api.goosebump.com/user/checkIfHookEvents', {
                params: {
                  events: response.data,
                  userId
                }
              })
              .then(response => {
                let events = response.data
                let calls = []
                for (let event of events) {
                  let eventId = event.id
                  calls.push(
                    axios.get(
                      'https://alakazam.goosebump.com:4242/friendsGoing',
                      {
                        params: {
                          eventId,
                          userId
                        }
                      }
                    )
                  )
                }
                Promise.all(calls).then(friendsGoing => {
                  for (let i = 0; i < events.length; i++) {
                    events[i].friendsGoing = friendsGoing[i].data
                  }
                  dispatch(eventSimilars(events))
                })
              })
          } else {
            dispatch(eventSimilars(response.data))
          }
        })
        .catch(error => {
          console.log(error)
        })
      return dispatch(eventSuccess(response.data))
    })
    .catch(error => {
      console.error(error.response)
      return dispatch(eventFailure(error.response))
    })
}

export const eventInterested = (eventId, userId) => (dispatch, getState) => {
  dispatch({ type: EVENT_INTERESTED })
  if (!userId) {
    const state = getState()
    if (state.user) userId = state.user.id
  }
  if (userId) {
    amplitude.logEvent('app_event_interested', { eventId })
  }
  return axios
    .post('https://api.goosebump.com/event/interested', {
      eventId,
      userId
    })
    .catch(error => {
      console.error(error.response)
      return dispatch(eventFailure(error.response))
    })
}

export const eventGoing = (eventId, userId) => (dispatch, getState) => {
  dispatch({ type: EVENT_GOING })
  if (!userId) {
    const state = getState()
    if (state.user) userId = state.user.id
  }
  if (userId) {
    amplitude.logEvent('app_event_going', { eventId })
  }
  return axios
    .post('https://api.goosebump.com/event/going', {
      eventId,
      userId
    })
    .catch(error => {
      console.error(error.response)
      return dispatch(eventFailure(error.response))
    })
}

export const eventShare = (eventId, userId) => (dispatch, getState) => {
  if (!userId) {
    const state = getState()
    if (state.user) userId = state.user.id
  }
  if (userId) {
    amplitude.logEvent('app_event_share', { eventId })
  }
}

export const eventTickets = (eventId, userId) => (dispatch, getState) => {
  if (!userId) {
    const state = getState()
    if (state.user) userId = state.user.id
  }
  if (userId) {
    amplitude.logEvent('app_event_tickets', { eventId })
  }
}

// we've successfully fetch event
export const eventSuccess = data => {
  return {
    type: EVENT_SUCCESS,
    data
  }
}

// we've successfully fetch friends going
export const eventFriendsGoing = data => {
  return {
    type: EVENT_FRIENDS_GOING,
    data
  }
}

// we've successfully fetch similars events
export const eventSimilars = data => {
  return {
    type: EVENT_SIMILARS,
    data
  }
}

// we've had a problem fetching event
export const eventFailure = error => {
  return {
    type: EVENT_FAILURE,
    error
  }
}

export const actions = {
  eventRequest,
  eventInterested,
  eventGoing,
  eventShare,
  eventTickets,
  eventSuccess,
  eventFailure,
  eventFriendsGoing,
  eventSimilars
}

// ------------------------------------
// Action Handlers
// ------------------------------------
const ACTION_HANDLERS = {
  [EVENT_REQUEST]: state => ({ ...state, fetching: true }),
  [EVENT_SUCCESS]: (state, action) => ({
    ...state,
    fetching: false,
    error: null,
    id: action.data.id,
    fb_id: action.data.fb_uid,
    name: action.data.name,
    artistsPlaying: action.data.artists,
    description: action.data.description,
    startTime: action.data.start_time,
    endTime: action.data.end_time,
    attendingCount: action.data.attending_count,
    interestedCount: action.data.interested_count,
    cover: action.data.cover,
    style: action.data.style,
    music: action.data.music,
    place: action.data.place,
    ticket_uri: action.data.ticket_uri,
    promoters: action.data.promoter,
    interested: action.data.interested,
    going: action.data.going,
    timezone: action.data.timezone,
    friendsGoing: null,
    similars: null
  }),
  [EVENT_FRIENDS_GOING]: (state, action) => ({
    ...state,
    friendsGoing: action.data
  }),
  [EVENT_SIMILARS]: (state, action) => ({
    ...state,
    similars: action.data
  }),
  [EVENT_INTERESTED]: state => ({
    ...state,
    going: false,
    interested: !state.interested,
    interestedCount: state.interested
      ? state.interestedCount - 1
      : state.interestedCount + 1
  }),
  [EVENT_GOING]: state => ({
    ...state,
    going: !state.going,
    interested: false,
    attendingCount: state.going
      ? state.attendingCount - 1
      : state.attendingCount + 1,
    interestedCount: state.interested
      ? state.interestedCount - 1
      : state.interestedCount
  }),
  [EVENT_FAILURE]: (state, action) => ({
    ...state,
    fetching: false,
    error: action.payload.error
  })
}

// ------------------------------------
// Reducer
// ------------------------------------
const initialState = {
  fetching: true,
  error: null,
  id: null,
  fb_id: null,
  name: null,
  artistsPlaying: null,
  description: null,
  startTime: null,
  endTime: null,
  attendingCount: null,
  interestedCount: null,
  cover: null,
  style: null,
  music: null,
  place: null,
  ticket_uri: null,
  promoters: null,
  going: null,
  interested: null,
  friendsGoing: null,
  similars: null
}

export default function reducer(state = initialState, action) {
  const handler = ACTION_HANDLERS[action.type]

  return handler ? handler(state, action) : state
}
