import React, {Component} from 'react';
import {
  ActivityIndicator,
  Animated,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  StyleSheet,
  Image, 
  ImageStore, 
  Text, 
  Platform,
  View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {connect} from 'react-redux';
import { StackActions, NavigationActions } from 'react-navigation';
import {Buffer} from 'buffer';
import LottieView from 'lottie-react-native';
import FileSystem from 'react-native-fs';

import {FRONT_SERVICE_URL} from '../Constants';

class PictureReviewScreen extends React.Component {
  state = {
    processing: false,
    success: false,
    animationFinished: false,
  }
  submitButtonWidth = new Animated.Value(1);

  toggleSubmitButton = () => {
      Animated.timing(this.submitButtonWidth, {
          toValue: this.submitButtonWidth._value === 1 ? 0 : 1,
          duration: 400
      }).start();
  };

  submitImage = async () => {
    this.toggleSubmitButton();
    this.setState({processing: true})
    let uploadUri = ""
    await fetch(FRONT_SERVICE_URL + '/uploadItem', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: "51.923147",
          longitude: "-0.226299",
          jwt: this.props.userToken,
          mediaType: "image",
        }),
      })
      .then((response) => response.json())
      .then((responseJson) => {
        if (responseJson.hasOwnProperty('error')) {
          console.error(responseJson.error);
        } else {
          uploadUri = responseJson.uploadUrl;
        }
      })
      .catch((error) => {
        console.error(error);
      });
      let imageUri = this.props.navigation.state.params.imageUri;
      await ImageStore.getBase64ForTag(imageUri, async (base64Data) => {
        const buffer = Buffer.from(base64Data, 'base64')
        await fetch(uploadUri, {
          method: 'PUT',
          headers: {
          'Content-Type': 'image/jpeg; charset=utf-8',
         },
          body: buffer,
        })
        .then((response) => console.log(response))
        .catch((error) => {
          console.error(error);
        });
        if (Platform.OS == "ios") {
          await ImageStore.removeImageForTag(imageUri);
        } else {
          await FileSystem.unlink(imageUri);
        }
        this.setState({processing: false, success: true})
      }, (error) => console.log(error));
    //Error on screen
  }
  
  render() {
    if (this.state.animationFinished) {
      let resetAction = StackActions.reset({
        index: 0,
        actions: [
          NavigationActions.navigate({ routeName: 'CameraPicture' })
        ],
      });
      this.props.navigation.dispatch(resetAction);
      this.props.navigation.navigate('Feed');
    }
    let button = (
      <TouchableOpacity onPress={this.submitImage}>
          <Text style={styles.buttonText}>Submit</Text>
      </TouchableOpacity>
    );
    if (this.state.processing) {
      button = (
        <LottieView
          ref={animation => {
            if (animation) {
              animation.play(0, 44);
            }
          }}
          source={require('../assets/loading.json')}
        />
      );
    }
    if (this.state.success) {
      button = (
        <LottieView
          ref={animation => {
            if (animation) {
              this.animation = animation;
              animation.play(44, 95);
            }
          }}
          onAnimationFinish={() => {
            this.setState({animationFinished: true})
          }}
          loop={false}
          source={require('../assets/loading.json')}
        />
      );
    }
    const buttonWidth = this.submitButtonWidth.interpolate({
        inputRange: [0, 1],
        outputRange: [60, Dimensions.get('window').width*0.7]
    });
    return (
      <View style={styles.container}>
        <View style={[styles.iconContainer, {bottom: Dimensions.get('window').height-80, left: 20}]}>
          <TouchableOpacity style={styles.icon} onPress={() => { this.props.navigation.goBack() }}>
            <Icon name="close" size={40} color="white"/>
          </TouchableOpacity>
        </View>
        <Image source={{uri: this.props.navigation.state.params.imageUri}} style={{
            marginTop: 100,
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').width,}} 
            resizeMode="contain"/>
        <View style={{flex: 1, justifyContent: 'center'}}>
          <Animated.View style={[styles.submitButton,{width: buttonWidth}]} >
            {button}
          </Animated.View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: '#D7E7ED',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'absolute'
  },
  submitButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    borderRadius: 30,
    height: 60,
  },
  buttonText: {
      fontFamily: 'Avenir',
      color: 'white',
      fontSize: 20,
      padding: 13,
      textAlign: 'center',
  },
});

const mapStateToProps = (state) => {
  const {userToken} = state.main;
  return {userToken};
}

export default connect(mapStateToProps)(PictureReviewScreen);