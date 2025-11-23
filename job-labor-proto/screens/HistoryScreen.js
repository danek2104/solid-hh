import React from 'react';
import { FlatList, Text } from 'react-native';
import { styles } from '../AppStyles';
import Section from '../components/Section';
import ClosedShiftCard from '../components/ClosedShiftCard';
import TimelineItem from '../components/TimelineItem';

const HistoryScreen = ({ closedShifts, timelineMilestones, isCompact }) => (
    <>
        <Section title="Закрытые смены" compact={isCompact}>
            <FlatList
                data={closedShifts}
                keyExtractor={(item, index) => String(item.title || index)}
                renderItem={({ item: shift }) => (
                    <ClosedShiftCard {...shift} />
                )}
                scrollEnabled={false}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
            />
        </Section>

        <Section title="Рекомендации" compact={isCompact}>
            <Text style={styles.sectionSubtitle}>
                Закрытые смены влияют на рейтинг. Добавьте отзывы, чтобы удерживать
                статус «Top Performer».
            </Text>
            {timelineMilestones.map((item) => (
                <TimelineItem
                    key={`${item.title}-history`}
                    compact={isCompact}
                    {...item}
                />
            ))}
        </Section>
    </>
);

export default HistoryScreen;
