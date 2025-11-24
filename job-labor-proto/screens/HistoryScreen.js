import React from 'react';
import { FlatList, Text } from 'react-native';
import { styles } from '../AppStyles';
import Section from '../components/Section';
import ClosedShiftCard from '../components/ClosedShiftCard';
import TimelineItem from '../components/TimelineItem';

const HistoryScreen = ({ closedShifts, timelineMilestones, isCompact }) => (
    <>
        <Section title="Закрытые смены" compact={isCompact}>
            {closedShifts.length > 0 ? (
                closedShifts.map((shift) => (
                    <ClosedShiftCard key={shift.id || shift.title} {...shift} />
                ))
            ) : (
                <Text style={styles.emptyText}>Нет закрытых смен</Text>
            )}
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
