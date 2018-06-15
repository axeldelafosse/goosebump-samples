import React, { PureComponent } from 'react'
import { View, Text, Linking, Alert, Dimensions } from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Polyglot from 'react-polyglot-provider'
import styled from 'styled-components'
import Hyperlink from 'react-native-hyperlink'
import ReadMore from 'react-native-read-more-text'
import LinearGradient from 'react-native-linear-gradient'

import wordings from '../wordings'
import getLocale from '../getLocale'
import * as userActions from '../redux/modules/user'
import * as eventActions from '../redux/modules/event'

import StatusBar from '../components/StatusBar'
import { MessengerFullIcon } from '../components/Icons'
import Spinner from '../components/Spinner'
import EventCardTabBar from '../components/EventCardTabBar'
import EventsCarousel from '../components/EventsCarousel'
import FriendsSlider from '../components/FriendsSlider'
import ArtistsList from '../components/ArtistsList'
import { formatEvent, formatDateAndTime } from '../lib/formatEvent'
import {
  Calendar,
  CalendarShadow,
  CalendarTop,
  CalendarMonth,
  CalendarDayNb,
  CalendarDay,
  EventGenre,
  MusicGenre,
  ModuleCard,
  EventNameContainer,
  EventName,
  EventCover,
  EventPageInfo,
  EventCTA,
  EventShareCTA,
  Header,
  HeaderTitle,
  Semibold,
  ModuleCardWithPadding,
  HeaderWithoutPadding,
  Desc,
  CardHeader
} from '../styles'
import { eventRowMaxWidth, moderateScale } from '../lib/scaling'
import BackButton from '../components/BackButton'
import shareMessenger from '../lib/shareMessenger'
import { MessageDialog } from 'react-native-fbsdk'

const { width } = Dimensions.get('window')

const SafeAreaView = styled.SafeAreaView`
  flex: 1;
  background-color: transparent;
`

const ScrollView = styled.ScrollView`
  flex: 1;
  background-color: #f2f4f9;
`

const ModuleInfo = styled.Text`
  color: #0a072e;
  font-size: 18px;
  line-height: 22px;
`

const ModuleInfoAdd = styled.Text`
  color: #6a7c94;
  font-size: 14px;
  line-height: 25px;
`

const EventRowMaxWidth = styled.View`
  max-width: ${eventRowMaxWidth(260)}px;
`

const EventInviteFriends = styled.View`
  padding-left: 16px;
  padding-bottom: 16px;
  min-height: 42px;
`

class Event extends PureComponent {
  componentDidMount() {
    let eventId = this.props.match.params.id

    if (
      !this.props.event.id ||
      (this.props.event.id && parseInt(eventId) !== this.props.event.id)
    ) {
      const { eventRequest } = this.props.eventActions
      eventRequest(eventId, this.props.user.id)
    }
  }

  componentWillReceiveProps(nextProps) {
    if (
      this.props.location.pathname !== nextProps.location.pathname &&
      nextProps.location.pathname.includes('event') &&
      nextProps.location.pathname.split('/')[2]
    ) {
      const eventId = nextProps.location.pathname.split('/')[2]
      const { eventRequest } = this.props.eventActions
      eventRequest(eventId, nextProps.user.id)
    }
  }

  redirectToGmaps(direction) {
    Linking.canOpenURL('comgooglemapsurl://')
      .then(supported => {
        if (!supported) {
          Linking.openURL(direction).catch(err =>
            console.error('An error occurred', err)
          )
        } else {
          const deepDirection = direction.replace(
            'https://',
            'comgooglemapsurl://'
          )
          Linking.openURL(deepDirection).catch(err =>
            console.error('An error occurred', err)
          )
        }
      })
      .catch(err => console.error('An error occurred', err))
  }

  share(t) {
    const shareContent = shareMessenger(
      t,
      this.props.user,
      this.props.event,
      this.props.eventActions.eventShare
    )
    MessageDialog.canShow(shareContent)
      .then(canShow => {
        if (canShow) {
          return MessageDialog.show(shareContent)
        } else {
          Alert.alert(t('event.shareMessengerAlert'), '', [{ text: 'OK' }])
        }
      })
      .then(
        result => {},
        error => {
          Alert.alert('Error', error, [{ text: 'OK' }])
        }
      )
  }

  render() {
    const { user, event } = this.props

    let eventId = this.props.match.params.id
    if (!event.id || event.id !== parseInt(eventId)) {
      return <Spinner />
    }

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
    const { music, month, day, dayNb, place, address, direction } = formatEvent(
      event,
      user
    )

    return (
      <Polyglot
        locale={getLocale(user.locale)}
        wordings={wordings}
        render={({ t }) => (
          <LinearGradient
            colors={['#7c71ff', 'transparent']}
            style={{
              flex: 1
            }}>
            <SafeAreaView>
              <StatusBar barStyle="light-content" backgroundColor="#7c71ff" />
              <CardHeader />
              <ScrollView
                showsVerticalScrollIndicator={false}
                overScrollMode={'auto'}>
                <BackButton history={this.props.history} background />
                <EventCover
                  source={{
                    uri: event.cover
                  }}
                />
                <View>
                  <ModuleCardWithPadding
                    style={{
                      marginTop: 0,
                      flexDirection: 'row',
                      overflow: 'hidden',
                      elevation: 0
                    }}>
                    <View>
                      <CalendarShadow>
                        <Calendar>
                          <CalendarTop>
                            <CalendarDay>{day.toUpperCase()}</CalendarDay>
                          </CalendarTop>
                          <CalendarDayNb>{dayNb}</CalendarDayNb>
                          <CalendarMonth>{month.toUpperCase()}</CalendarMonth>
                        </Calendar>
                      </CalendarShadow>
                    </View>
                    <View>
                      <EventNameContainer>
                        <EventName
                          numberOfLines={3}
                          style={{ maxWidth: width - 81 }}>
                          {event.name.toUpperCase()}
                        </EventName>
                      </EventNameContainer>
                      {music &&
                        music[0] && (
                          <EventGenre>
                            <MusicGenre numberOfLines={1}>
                              {music[0]}
                            </MusicGenre>
                            {music[1] && (
                              <MusicGenre
                                style={{ marginLeft: 5 }}
                                numberOfLines={1}>
                                {music[1]}
                              </MusicGenre>
                            )}
                          </EventGenre>
                        )}
                    </View>
                  </ModuleCardWithPadding>
                  <EventCardTabBar
                    key={`event-${event.id}`}
                    t={t}
                    user={user}
                    event={event}
                    eventPage
                    eventActions={this.props.eventActions}
                  />
                  <ModuleCardWithPadding style={{ marginTop: 0 }}>
                    <View>
                      <ModuleInfo>
                        {t('event.date', {
                          longStartDate,
                          startTime,
                          endTime
                        })}
                      </ModuleInfo>
                      <ModuleInfoAdd>
                        {t('event.longDate', {
                          startDate,
                          startTime,
                          endDate,
                          endTime
                        })}
                      </ModuleInfoAdd>
                    </View>
                    {event.place &&
                      direction && (
                        <EventPageInfo>
                          <EventRowMaxWidth>
                            <ModuleInfo>{place}</ModuleInfo>
                            <ModuleInfoAdd>{address}</ModuleInfoAdd>
                          </EventRowMaxWidth>
                          <EventCTA
                            activeOpacity={0.5}
                            onPress={() => this.redirectToGmaps(direction)}>
                            {t('event.directions')}
                          </EventCTA>
                        </EventPageInfo>
                      )}
                    {event.place &&
                      !direction && (
                        <EventPageInfo>
                          <ModuleInfo>{place}</ModuleInfo>
                          <ModuleInfoAdd>{address}</ModuleInfoAdd>
                        </EventPageInfo>
                      )}
                  </ModuleCardWithPadding>
                  <ModuleCard>
                    <Header>
                      <HeaderTitle>{t('event.attendance')}</HeaderTitle>
                    </Header>
                    <Text
                      style={{
                        paddingTop: 6,
                        paddingRight: 16,
                        paddingBottom: 16,
                        paddingLeft: 16,
                        color: '#0A072E'
                      }}>
                      <Semibold>{event.attendingCount}</Semibold>{' '}
                      {t('event.peopleGoing')} •{' '}
                      <Semibold>{event.interestedCount}</Semibold>{' '}
                      {t('event.peopleInterested')}
                    </Text>
                    {event.friendsGoing &&
                      event.friendsGoing.length !== 0 && (
                        <FriendsSlider
                          t={t}
                          user={user}
                          friendsGoing={event.friendsGoing}
                        />
                      )}
                    {event.friendsGoing &&
                      event.friendsGoing.length === 0 && (
                        <EventInviteFriends>
                          <EventRowMaxWidth>
                            <Text>{t('event.inviteFriends')}</Text>
                          </EventRowMaxWidth>
                          <View style={{ position: 'absolute', right: 16 }}>
                            <EventShareCTA
                              activeOpacity={0.5}
                              onPress={() => this.share(t)}>
                              <View
                                style={{
                                  position: 'absolute',
                                  left: moderateScale(15),
                                  zIndex: 1
                                }}>
                                <MessengerFullIcon
                                  color="white"
                                  size={moderateScale(14)}
                                />
                              </View>
                              {t('event.inviteFriendsCTA')}
                            </EventShareCTA>
                          </View>
                        </EventInviteFriends>
                      )}
                  </ModuleCard>
                  {event.artistsPlaying &&
                    event.artistsPlaying.length > 0 && (
                      <View>
                        <ModuleCard>
                          <Header>
                            <HeaderTitle>{t('event.lineup')}</HeaderTitle>
                          </Header>
                          <ArtistsList
                            t={t}
                            artists={event.artistsPlaying}
                            {...this.props}
                          />
                        </ModuleCard>
                      </View>
                    )}
                  <ModuleCardWithPadding>
                    <HeaderWithoutPadding>
                      <HeaderTitle>{t('event.description')}</HeaderTitle>
                    </HeaderWithoutPadding>
                    <Hyperlink
                      linkDefault={true}
                      linkStyle={{ color: '#7c71ff' }}>
                      <ReadMore
                        numberOfLines={6}
                        renderTruncatedFooter={onPress => (
                          <Text
                            onPress={onPress}
                            style={{ color: '#7c71ff', fontWeight: '600' }}>
                            {t('artist.more')}
                          </Text>
                        )}
                        renderRevealedFooter={onPress => (
                          <Text
                            onPress={onPress}
                            style={{ color: '#7c71ff', fontWeight: '600' }}>
                            {t('artist.less')}
                          </Text>
                        )}>
                        <Desc>{event.description}</Desc>
                      </ReadMore>
                    </Hyperlink>
                  </ModuleCardWithPadding>
                  {event.similars &&
                    event.similars.length !== 0 && (
                      <ModuleCard>
                        <Header
                          style={{
                            marginBottom: 0
                          }}>
                          <HeaderTitle>{t('event.similars')}</HeaderTitle>
                        </Header>
                        <EventsCarousel
                          t={t}
                          user={user}
                          events={event.similars}
                          eventActions={this.props.eventActions}
                        />
                      </ModuleCard>
                    )}
                </View>
              </ScrollView>
            </SafeAreaView>
          </LinearGradient>
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
