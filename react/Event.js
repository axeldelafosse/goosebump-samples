import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Helmet from 'react-helmet'
import Modal from 'react-modal'
import queryString from 'query-string'
import nl2br from 'react-nl2br'
import moment from 'moment-timezone'
import 'moment/locale/fr'
import Linkify from 'react-linkify'
import { Redirect } from 'react-router-dom'

import Polyglot from 'react-polyglot-provider'
import wordings from '../../wordings'
import getLocale from '../../getLocale'
import * as userActions from '../../redux/modules/user'
import * as eventActions from '../../redux/modules/event'
import './Event.css'
import {
  FacebookFullIcon,
  FacebookIcon,
  MessengerFullIcon,
  CrossIcon,
  ConfettiIcon,
  CloseIcon
} from '../../components/Icons/Icons'

import shareMessenger from '../../lib/shareMessenger'
import { formatDateAndTime } from '../lib/formatEvent'

import Header from '../../components/Header/Header'
import Spinner from '../../components/Spinner/Spinner'
import TabBar from '../../components/TabBar/TabBar'
import ArtistRow from '../../components/ArtistRow/ArtistRow'
import EventCardTabBar from '../../components/EventCardTabBar/EventCardTabBar'
import ReadMore from '../../components/ReadMore/ReadMore'
import TaggableFriendRow from '../../components/TaggableFriendRow/TaggableFriendRow'
import EventsCarousel from '../../components/EventsCarousel/EventsCarousel'
import LoginWithFacebook from '../../components/LoginWithFacebook/LoginWithFacebook'
import Line from '../../components/Line/Line'
import LazyImg from '../../components/LazyImg/LazyImg'
import FriendsSlider from '../../components/FriendsSlider/FriendsSlider'

class Event extends Component {
  constructor(props) {
    super(props)
    this.state = {
      modal: false,
      directions: false,
      tickets: false,
      share: false,
      followArtist: null,
      messengerExtensions: false,
      redirectToLogin: false,
      closeModalFollowArtist: false,
      attendEvent: false
    }
    this.openModal = this.openModal.bind(this)
    this.closeModal = this.closeModal.bind(this)
  }

  static fetchData(params, userId) {
    const eventId = params.id.split('?')[0]
    if (userId) return eventActions.eventRequest(eventId, userId)
    return eventActions.eventRequest(eventId)
  }

  static fetchUser(userId) {
    return userActions.loginRequest({ userId })
  }

  checkIfUserJustLoggedIn(eventId, attendEvent) {
    this.setState({ attendEvent })
    if (attendEvent === 'going') {
      const { eventGoing } = this.props.eventActions
      eventGoing(eventId, this.props.user.id)
    }
    if (attendEvent === 'interested') {
      const { eventInterested } = this.props.eventActions
      eventInterested(eventId, this.props.user.id)
    }
  }

  componentDidMount() {
    let eventId = this.props.match.params.id
    if (eventId.includes('?')) eventId = eventId.split('?')[0]

    if (
      window.MessengerExtensions &&
      window.MessengerExtensions.isInExtension()
    ) {
      this.setState({ messengerExtensions: true })
    }

    if (!this.props.user.id) {
      const { loginRequest } = this.props.userActions
      window.fbInit.promise.then(() => {
        window.FB.getLoginStatus(response => {
          if (response.status === 'connected') {
            loginRequest({
              id: response.authResponse.userID,
              token: response.authResponse.accessToken
            })
          } else {
            console.log('not_logged')
            const query = queryString.parse(this.props.location.search)
            const userId = query.id
            if (userId) {
              loginRequest({ userId })
            } else {
              if (this.state.messengerExtensions) {
                window.MessengerExtensions.getUserID(
                  function success(uids) {
                    const psid = uids.psid
                    loginRequest({ psid })
                  },
                  function error(err, errorMessage) {
                    console.error(err)
                  }
                )
              } else if (!this.props.event.id) {
                const { eventRequest } = this.props.eventActions
                eventRequest(eventId)
              }
            }
          }
        })
      })
    } else if (!this.props.event.id) {
      const { eventRequest } = this.props.eventActions
      const query = queryString.parse(this.props.match.params.id.split('?')[1])
      const attendEvent = query.attendEvent
      const checkIn = query.checkIn
      eventRequest(eventId, this.props.user.id).then(() => {
        if (attendEvent) this.checkIfUserJustLoggedIn(eventId, attendEvent)
      })
    }

    if (
      !this.props.event.id ||
      (this.props.event.id && parseInt(eventId) !== this.props.event.id)
    ) {
      const { eventRequest } = this.props.eventActions
      eventRequest(eventId)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.match.params.id !== nextProps.match.params.id) {
      const eventId = nextProps.match.params.id
      const { eventRequest } = this.props.eventActions
      if (nextProps.user.id) {
        eventRequest(eventId, nextProps.user.id)
      } else {
        eventRequest(eventId)
      }
    }

    if (
      this.props.user.id !== nextProps.user.id &&
      (!this.props.event.id ||
        this.props.user.fb_permissions !== nextProps.user.fb_permissions)
    ) {
      let eventId = this.props.match.params.id
      if (eventId.includes('?')) eventId = eventId.split('?')[0]
      const { eventRequest } = this.props.eventActions
      eventRequest(eventId, nextProps.user.id)
    }

    if (
      this.props.user.followedArtists &&
      this.props.user.followedArtists.length !==
        nextProps.user.followedArtists.length
    ) {
      if (
        this.props.user.followedArtists.length === 0 &&
        nextProps.user.followedArtists.length === 1
      ) {
        this.setState({
          modal: true,
          followArtist: nextProps.user.followedArtists[0].picture
        })
      }
    }
  }

  openModal() {
    this.setState({ modal: true })
  }

  closeModal() {
    this.setState({ modal: false })
  }

  renderList(t) {
    return this.props.event.artistsPlaying.map((artist, i) => (
      <ArtistRow
        i={i}
        t={t}
        key={`artist-${artist.id}`}
        {...this.props}
        artist={artist}
        artists={this.props.event.artistsPlaying}
      />
    ))
  }

  loginWithFacebook() {
    let eventId = this.props.match.params.id
    if (eventId.includes('?')) eventId = eventId.split('?')[0]
    const redirect = encodeURIComponent(
      `https://www.goosebump.com/event/${eventId}`
    )
    let permissions =
      'public_profile,email,user_friends,user_location,user_events,user_likes,rsvp_event'
    window.location.href = `https://www.facebook.com/v2.9/dialog/oauth?client_id=467130310161761&redirect_uri=${redirect}&scope=${permissions}&response_type=token`
  }

  loginWithFacebookScanArtists() {
    let eventId = this.props.match.params.id
    if (eventId.includes('?')) eventId = eventId.split('?')[0]
    const redirect = encodeURIComponent(
      `https://www.goosebump.com/scan?referrer=event/${eventId}`
    )
    let permissions =
      'public_profile,email,user_friends,user_location,user_events,user_likes,rsvp_event'
    window.location.href = `https://www.facebook.com/v2.9/dialog/oauth?client_id=467130310161761&redirect_uri=${redirect}&scope=${permissions}&response_type=token`
  }

  redirectToFacebook() {
    const link = `https://www.facebook.com/${this.props.event.fb_id}`
    if (this.props.user && this.props.user.fb_uid) {
      window.open(
        `https://api.goosebump.com/log?user=${
          this.props.user.fb_uid
        }&link=${link}&button=event`,
        '_blank'
      )
    } else {
      window.open(link, '_blank')
    }
  }

  render() {
    const { event, user } = this.props
    const { attendEvent, messengerExtensions, redirectToLogin } = this.state

    if (event.fetching && event.id !== this.props.match.params.id) {
      return <Spinner />
    }

    if (redirectToLogin) {
      return (
        <Redirect
          to={{
            pathname: '/login',
            search: `?checkIn=42`,
            state: { referrer: this.props.location }
          }}
        />
      )
    }

    const music = event.music
    const localStartTime = moment(event.startTime)
      .tz(event.timezone)
      .locale(getLocale(user.locale))
    const month = localStartTime.format('MMM')
    const day = localStartTime.format('ddd')
    const dayNb = localStartTime.format('D')
    const {
      longStartDate,
      startDate,
      endDate,
      startTime,
      endTime
    } = formatDateAndTime(
      getLocale(user.locale),
      event.timezone,
      event.startTime,
      event.endTime
    )
    const place = event.place ? event.place.name : event.city
    let address =
      event.place && event.place.location
        ? `${event.place.location.street ? event.place.location.street : ''} ${
            event.place.location.zip ? event.place.location.zip : ''
          } ${event.place.location.city ? event.place.location.city : ''}`
        : ''
    let direction
    if (event.place && event.place.location && event.place.location.latitude) {
      direction = `https://maps.google.com/?saddr=Current+Location&daddr=${
        event.place.location.latitude
      },${event.place.location.longitude}`
    }
    let promoter
    if (event.promoters && event.promoters[0])
      promoter = event.promoters[0].name

    const eventStyle = this.state.modal ? { filter: 'blur(10px)' } : {}

    return (
      <Polyglot
        locale={getLocale(user.locale)}
        wordings={wordings}
        render={({ t }) => (
          <div>
            <div className="event" style={eventStyle}>
              <Helmet title={event.name} />
              <Header back style={{ position: 'absolute' }} {...this.props} />
              <div
                className="cover"
                style={{ backgroundImage: `url(${event.cover})` }}>
                <div className="cover-effect" />
              </div>
              <div className="event-content">
                <div className="module-card data" style={{ marginTop: '0px' }}>
                  <div className="calendar">
                    <div className="top">
                      <span className="day">{day}</span>
                    </div>
                    <span className="day-nb">{dayNb}</span>
                    <span className="month">{month}</span>
                  </div>
                  <div>
                    <div className="event-name">
                      <span className="name">{event.name}</span>
                    </div>
                    {music &&
                      music[0] && (
                        <div className="event-genre">
                          <span className="genre">
                            <span className="music-genre">{music[0]}</span>
                            {music[1] && (
                              <span
                                className="music-genre"
                                style={{ marginLeft: '5px' }}>
                                {music[1]}
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
                <EventCardTabBar
                  key={`event-${event.id}`}
                  t={t}
                  user={user}
                  event={event}
                  eventActions={this.props.eventActions}
                  messengerExtensions={messengerExtensions}
                  eventPage={true}
                  attendEvent={attendEvent}
                />
                <div className="module-card" style={{ marginTop: '0px' }}>
                  <div>
                    <p className="module-info">
                      {t('event.date', {
                        longStartDate,
                        startTime,
                        endTime
                      })}
                    </p>
                    <p className="module-info-add">
                      {t('event.longDate', {
                        startDate,
                        startTime,
                        endDate,
                        endTime
                      })}
                    </p>
                  </div>
                  {event.place && (
                    <div className="info">
                      <div className="row-width">
                        <p className="module-info">{place}</p>
                        <p className="module-info-add">{address}</p>
                      </div>
                      {direction && (
                        <button
                          onClick={e => window.open(direction, '_blank')}
                          className="event-cta"
                          style={{
                            right: '16px',
                            position: 'absolute',
                            marginTop: '6px'
                          }}>
                          <span>{t('event.directions')}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="module-card" style={{ padding: '0' }}>
                  <div
                    className="header"
                    style={{
                      padding: '16px 0 0 16px'
                    }}>
                    <span className="header-title">
                      {t('event.attendance')}
                    </span>
                  </div>
                  <div
                    className="event-attendees"
                    style={{ padding: '6px 16px 16px 16px' }}>
                    <span className="bold">{event.attendingCount}</span>{' '}
                    {t('event.peopleGoing')} •{' '}
                    <span className="bold">{event.interestedCount}</span>{' '}
                    {t('event.peopleInterested')}
                  </div>
                  {user.fb_permissions &&
                    event.friendsGoing &&
                    event.friendsGoing.length !== 0 && (
                      <FriendsSlider
                        t={t}
                        user={user}
                        friendsGoing={event.friendsGoing}
                      />
                    )}
                  {user.fb_permissions &&
                    event.friendsGoing &&
                    event.friendsGoing.length === 0 && (
                      <div>
                        <Line />
                        <div className="event-invite-friends">
                          <div className="row-width">
                            <span style={{ color: '#0A072E' }}>
                              {t('event.inviteFriends')}
                            </span>
                          </div>
                          {direction && (
                            <button
                              onClick={e =>
                                shareMessenger(
                                  t,
                                  user,
                                  event,
                                  this.props.eventActions.eventShare
                                )
                              }
                              className="event-cta"
                              style={{
                                right: '16px',
                                position: 'absolute',
                                marginTop: '6px'
                              }}>
                              <span style={{ paddingRight: '6px' }}>
                                <MessengerFullIcon color="white" size={11} />
                              </span>
                              <span>{t('event.inviteFriendsCTA')}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  {!user.fb_permissions && (
                    <div>
                      <Line />
                      <div className="event-trigger-login">
                        <span style={{ fontSize: '30px' }}>🙌</span>
                        <div style={{ paddingLeft: '10px' }}>
                          <div className="bold" style={{ fontSize: '18px' }}>
                            {t('event.friendsInterested')}
                          </div>
                          <div
                            style={{
                              fontSize: '14px',
                              maxWidth: '80%',
                              padding: '5px 0 5px 0'
                            }}>
                            {t('event.triggerLogin')}
                          </div>
                          <LoginWithFacebook
                            t={t}
                            user={user}
                            loginWithFacebook={e => this.loginWithFacebook()}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {event.artistsPlaying &&
                  event.artistsPlaying.length > 0 && (
                    <div>
                      {(!user.followedArtists ||
                        (user.followedArtists &&
                          user.followedArtists.length === 0)) &&
                        !this.state.closeModalFollowArtist && (
                          <div className="event-follow-artist">
                            <div
                              className="event-follow-artist-box"
                              onClick={e =>
                                this.setState({
                                  closeModalFollowArtist: true
                                })
                              }>
                              <h5 className="event-follow-artist-cta">
                                {t('event.followArtistCTA')}
                              </h5>
                              <h6 className="event-follow-artist-vp">
                                {t('event.followArtistVP')}
                              </h6>
                              <div
                                style={{
                                  position: 'absolute',
                                  right: '7px',
                                  top: '5px',
                                  opacity: '0.8',
                                  cursor: 'pointer'
                                }}>
                                <CrossIcon />
                              </div>
                              <icon className="event-follow-artist-icon" />
                            </div>
                          </div>
                        )}
                      <div
                        className="module-card"
                        style={{ alignItems: 'normal', padding: '0px' }}>
                        <div
                          className="header"
                          style={{
                            padding: '16px 0 0 16px'
                          }}>
                          <span className="header-title">
                            {t('event.lineup')}
                          </span>
                        </div>
                        {this.renderList(t)}
                      </div>
                    </div>
                  )}
                <div className="module-card">
                  <div className="header">
                    <span className="header-title">
                      {t('event.description')}
                    </span>
                  </div>
                  <div className="desc">
                    <Linkify>
                      <ReadMore
                        lines={6}
                        more={t('artist.more')}
                        less={t('artist.less')}>
                        {nl2br(event.description)}
                      </ReadMore>
                    </Linkify>
                  </div>
                </div>
                {event.similars &&
                  event.similars.length !== 0 && (
                    <EventsCarousel
                      t={t}
                      user={user}
                      text={t('event.similars')}
                      events={event.similars}
                      eventActions={this.props.eventActions}
                    />
                  )}
                <div className="event-fb">
                  <button
                    onClick={e => this.redirectToFacebook()}
                    className="event-cta"
                    style={{
                      marginRight: '10px',
                      marginLeft: '10px',
                      backgroundImage: 'none',
                      backgroundColor: '#3B5998',
                      border: '2px solid #3B5998'
                    }}>
                    <span style={{ paddingRight: '6px' }}>
                      <FacebookFullIcon />
                    </span>
                    {t('event.fb')}
                  </button>
                </div>
              </div>
              {user.followedArtists &&
                user.followedArtists.length === 1 && (
                  <div>
                    <Modal
                      isOpen={this.state.modal}
                      onRequestClose={this.closeModal}
                      className={{
                        base: 'modal'
                      }}
                      overlayClassName={{
                        base: 'modalOverlay',
                        afterOpen: 'modalOverlay_after-open',
                        beforeClose: 'modalOverlay_before-close'
                      }}>
                      <div className="modalSuccess">
                        <LazyImg
                          src={this.state.followArtist}
                          style={{
                            borderRadius: '50%',
                            height: '80px',
                            width: '80px'
                          }}
                          placeholder
                        />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center'
                        }}>
                        <div
                          style={{
                            position: 'absolute',
                            opacity: '0.25',
                            top: '0',
                            right: '0',
                            left: '0'
                          }}>
                          <ConfettiIcon />
                        </div>
                      </div>
                      <div className="center" style={{ marginTop: '45px' }}>
                        <h1 className="modalTitle">
                          {t('artist.follow', {
                            artist: user.followedArtists[0].name
                          })}
                          <span style={{ fontSize: '25px' }}> 🙌</span>
                        </h1>
                        <LoginWithFacebook
                          t={t}
                          user={user}
                          text={t('artist.loginScan')}
                          loginWithFacebook={e =>
                            this.loginWithFacebookScanArtists()
                          }
                        />
                      </div>
                    </Modal>
                  </div>
                )}
            </div>
            {user.followedArtists &&
              user.followedArtists.length === 1 &&
              this.state.modal && (
                <button className="btn-validation" onClick={this.closeModal}>
                  <CloseIcon />
                </button>
              )}
          </div>
        )}
      />
    )
  }
}

const mapStateToProps = state => ({
  user: state.user,
  event: state.event
})

const mapDispatchToProps = dispatch => ({
  userActions: bindActionCreators(userActions, dispatch),
  eventActions: bindActionCreators(eventActions, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(Event)
