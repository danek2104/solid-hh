import React from 'react';
import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';
import Card from './Card';

export const JobCardSkeleton = () => (
  <Card style={styles.card}>
    <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
    <Skeleton width="40%" height={20} style={{ marginBottom: 16 }} />
    <View style={styles.row}>
      <Skeleton width={20} height={20} borderRadius={10} style={{ marginRight: 8 }} />
      <Skeleton width="30%" height={16} />
    </View>
    <Skeleton width="20%" height={24} borderRadius={8} style={{ marginTop: 16 }} />
  </Card>
);

export const CandidateCardSkeleton = () => (
  <Card style={styles.card}>
    <View style={styles.row}>
      <Skeleton width={56} height={56} borderRadius={28} />
      <View style={{ marginLeft: 16, flex: 1 }}>
        <Skeleton width="70%" height={24} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={16} />
        <Skeleton width="30%" height={12} style={{ marginTop: 8, alignSelf: 'flex-end' }} />
      </View>
    </View>
  </Card>
);

export const CandidateProfileSkeleton = () => (
  <View style={{ padding: 16 }}>
    <View style={{ alignItems: 'center', marginBottom: 24 }}>
      <Skeleton width={80} height={80} borderRadius={40} style={{ marginBottom: 16 }} />
      <Skeleton width="60%" height={32} style={{ marginBottom: 8 }} />
      <Skeleton width="40%" height={20} />
    </View>
    <View style={{ flexDirection: 'row', marginBottom: 24 }}>
      <Skeleton width="48%" height={50} borderRadius={12} style={{ marginRight: '4%' }} />
      <Skeleton width="48%" height={50} borderRadius={12} />
    </View>
    <Card style={styles.card}>
      <Skeleton width="40%" height={24} style={{ marginBottom: 16 }} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Skeleton width={80} height={32} borderRadius={16} />
        <Skeleton width={100} height={32} borderRadius={16} />
        <Skeleton width={60} height={32} borderRadius={16} />
      </View>
    </Card>
    <Card style={styles.card}>
       <Skeleton width="40%" height={24} style={{ marginBottom: 16 }} />
       <Skeleton width="100%" height={20} style={{ marginBottom: 12 }} />
       <Skeleton width="100%" height={20} />
    </Card>
  </View>
);

export const JobDetailsSkeleton = () => (
    <View style={{ padding: 16 }}>
       <Card style={styles.card}>
          <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
             <Skeleton width={100} height={24} />
             <Skeleton width={50} height={24} borderRadius={12}/>
          </View>
       </Card>
       <Card style={styles.card}>
           <Skeleton width="30%" height={16} style={{marginBottom: 8}}/>
           <Skeleton width="100%" height={40} borderRadius={8} style={{marginBottom: 16}}/>
           <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <Skeleton width="48%" height={40} borderRadius={8}/>
                <Skeleton width="48%" height={40} borderRadius={8}/>
           </View>
       </Card>
    </View>
);

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
