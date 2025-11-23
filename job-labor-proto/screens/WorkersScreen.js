import React from 'react';
import { View, FlatList } from 'react-native';
import { styles } from '../AppStyles';
import Section from '../components/Section';
import Chip from '../components/Chip';
import WorkerCard from '../components/WorkerCard';

const WorkersScreen = ({ workerFilters, workersPool, isCompact }) => (
    <>
        <Section title="Фильтр исполнителей" compact={isCompact}>
            <View style={[styles.chipsRow, isCompact && styles.chipsRowCompact]}>
                {workerFilters.map((filter) => (
                    <Chip key={filter} label={filter} />
                ))}
            </View>
        </Section>
        <Section title="Доступные работники" compact={isCompact}>
            <FlatList
                data={workersPool}
                keyExtractor={(item, index) => String(item.name || index)}
                renderItem={({ item: worker }) => (
                    <WorkerCard {...worker} />
                )}
                scrollEnabled={false}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
            />
        </Section>
    </>
);

export default WorkersScreen;
