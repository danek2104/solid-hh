import React from 'react';
import { ScrollView } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from '../../AppStyles';

import JobsScreen from '../../screens/JobsScreen';

export default function Jobs() {
    const { width } = useWindowDimensions();
    const isCompact = width < 390;

    // Placeholder data
    const applications = [];
    const jobs = [];
    const jobFilterTags = [];
    const jobFilters = {};
    const applyToJobMutation = { isPending: false };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={[
                styles.contentContainer,
                isCompact && styles.contentCompact,
            ]}
        >
            <LinearGradient
                colors={['#C62828', '#8E0000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.hero, isCompact && styles.heroCompact]}
            >
                {/* ... hero content */}
            </LinearGradient>
            <JobsScreen
                isCompact={isCompact}
                applicationsView={false}
                setApplicationsView={() => { }}
                isApplicationsLoading={false}
                applicationsError={null}
                refetchJobs={() => { }}
                applications={applications}
                getApplicationStatusColor={() => { }}
                getApplicationStatusLabel={() => { }}
                jobSearchQuery={""}
                setJobSearchQuery={() => { }}
                jobFilterTags={jobFilterTags}
                jobFilters={jobFilters}
                handleJobFilterChange={() => { }}
                isJobsLoading={false}
                jobsError={null}
                jobs={jobs}
                handleJobSelect={() => { }}
                jobApplicationModalVisible={false}
                handleCloseJobModal={() => { }}
                isJobDetailsLoading={false}
                jobDetails={null}
                applicationMessage={""}
                setApplicationMessage={() => { }}
                applyToJobMutation={applyToJobMutation}
                handleJobApply={() => { }}
            />
        </ScrollView>
    );
}
