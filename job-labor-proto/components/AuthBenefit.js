import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from '../AppStyles';

const AuthBenefit = ({ icon, title, subtitle }) => (
  <View style={styles.authBenefit}>
    <View style={styles.authBenefitIcon}>
      <Ionicons name={icon} size={18} color="#C62828" />
    </View>
    <View style={styles.authBenefitBody}>
      <Text style={styles.authBenefitTitle}>{title}</Text>
      <Text style={styles.authBenefitSubtitle}>{subtitle}</Text>
    </View>
  </View>
);

export default AuthBenefit;
