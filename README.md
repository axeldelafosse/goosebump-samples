# goosebump_samples

Hey guys! I put some samples of our webapp and our mobile app in this repo to show you some code. It's our event page.

Please keep in mind that we had to go fast and iterate quickly. So the code is not as clean as it could be.

Here is some notable facts:

## Webapp (React)
- Streaming Server Side Rendering
- Route splitting
= Optimized Critical Rendering Path (Time To Render). We used our webapp directly within webviews in Messenger. Thanks to theses optimizations it was really fast.

## Mobile app (React Native)
- We started to switch to a GraphQL API so we used Apollo (+ Redux)
- Added a feature on FB SDK module to let users share an event directly with their friends in Messenger (Java/Objective C)
- I used styled-components (css in js) and loved it. I would have used it in our webapp as well.

## Both
- Full analytics (we used Segment to plug Mixpanel and Amplitude. Then we switch to Amplitude only)
- i18n with Polyglot.js by Airbnb. I created my own module to use a render prop (why? check this: https://www.youtube.com/watch?v=BcVAq3YFiuc)
- Did some code sharing (components/redux/css) between React and React Native
