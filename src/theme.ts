export const C = { teal: '#146375', green: '#3C8D70', leaf: '#99CB5B', lime: '#D4EA50', cream: '#F5EFB3', ink: '#183C3D', muted: '#536968', paper: '#F7F9F1', white: '#FFFFFF', line: '#D6E1D5', soft: '#EDF3E4', error: '#A62E2A', success: '#246344' };
export const activityTones = {
  river: { ink: '#185477', fill: '#E1F0FA', icon: 'water-outline', label: 'riverCategory' },
  trees: { ink: '#286137', fill: '#E3F0DB', icon: 'leaf-outline', label: 'treesCategory' },
  recycling: { ink: '#80501A', fill: '#FFF0C9', icon: 'refresh-circle-outline', label: 'recyclingCategory' },
  coastal: { ink: '#145F61', fill: '#DDF2ED', icon: 'boat-outline', label: 'coastalCategory' },
  community: { ink: '#88492D', fill: '#FBE8DB', icon: 'people-outline', label: 'communityCategory' },
} as const;
export type ActivityCategory = keyof typeof activityTones;
