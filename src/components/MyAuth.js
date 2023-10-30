import React, { useEffect, useState } from 'react';
import { GoogleLogin, GoogleLogout } from 'react-google-login';
import { gapi } from 'gapi-script';

const clientId = process.env.REACT_APP_schedules;
console.log(clientId)

let payload = {
  category_id: 3,
  description: "abc",
  end_time: "2023-11-01T18:42:00Z",
  frequency: "WEEKLY",
  lang: "en",
  on_days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
  partner_id: [1407],
  pathway_id: 7,
  space_id: "",
  start_time: "2023-11-01T17:42:00Z",
  title: "new",
  type: "batch",
  volunteer_id: 26
};

const MyAuth = () => {
  const [isGoogleApiInitialized, setIsGoogleApiInitialized] = useState(false);

  const scheduleMeetings = () => {
    if (!isGoogleApiInitialized) {
      console.log('Google API not initialized. Please try again.');
      return;
    }

    const { start_time, on_days, frequency, title } = payload;
    const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    // number of meetings could be 28 or any other number as per requirement:-
    const numMeetings = 2;
    let meetingTime = new Date(start_time);
    const meetingData = [];

    for (let i = 0; i < numMeetings; i++) {
      if (on_days.includes(daysOfWeek[meetingTime.getUTCDay()])) {
        meetingData.push({
          scheduledStartTime: meetingTime.toISOString(),
          description: `Meeting ${i + 1} - ${title}`,
        });
      }

      meetingTime.setDate(meetingTime.getDate() + 7);
    }

    scheduleMeetingsOnYouTube(meetingData);
  };

  const scheduleMeetingsOnYouTube = (meetings) => {
    gapi.client.load('youtube', 'v3', () => {
      // need to add a timer so that meetings are not scheduled at the same time because os api call limit. We can have a gap of 1 min between each meeting to be scheduled for youtube.
      meetings.forEach((meeting, index) => {
        gapi.client.youtube.liveBroadcasts.insert({
          part: 'snippet,status',
          resource: {
            snippet: {
              title: meeting.description,
              scheduledStartTime: meeting.scheduledStartTime,
              description: meeting.description,
            },
            status: {
              privacyStatus: 'unlisted',
            },
          },
        }).then((response) => {
          console.log(`Scheduled live broadcast for Meeting ${index + 1}:`, response.result);
        }).catch((error) => {
          console.error(`Error scheduling live broadcast for Meeting ${index + 1}:`, error);
        });
      });
    });
  };

  const onLoginSuccess = (res) => {
    if (isGoogleApiInitialized) {
      console.log('Login Success: currentUser:', res.profileObj);
      const accessToken = gapi.auth.getToken().access_token;
      console.log(accessToken);
    } else {
      console.log('Google API not initialized. Please try again.');
    }
  };

  const onLoginFailure = (res) => {
    console.log('Login failed: res:', res);
  };

  const onLogoutSuccess = () => {
    console.log('Logged Out successfully');
  };

  useEffect(() => {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        clientId: clientId,
        scope: 'https://www.googleapis.com/auth/youtube',
      }).then(() => {
        setIsGoogleApiInitialized(true);
      });
    });
  }, []);

  return (
    <div>
      <div id="signInButton">
        <GoogleLogin
          clientId={clientId}
          buttonText='Login'
          onSuccess={onLoginSuccess}
          onFailure={onLoginFailure}
          cookiePolicy={'single_host_origin'}
          isSignedIn={true}
        />
      </div>

      <div id="signOutButton">
        <GoogleLogout
          clientId={clientId}
          buttonText='Logout'
          onLogoutSuccess={onLogoutSuccess}
        />
      </div>

      <button onClick={scheduleMeetings}>Schedule Meetings</button>
    </div>
  );
};

export default MyAuth;
