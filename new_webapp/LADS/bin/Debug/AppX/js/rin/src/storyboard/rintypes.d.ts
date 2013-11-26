//
// NonlinearStoryboard type definitions
//
// Copyright (C) 2013 Microsoft Research 
//

// RIN Keyframe
interface Keyframe { offset: number; holdDuration?: number; data?: any; state?: any; easingDuration?: number;
};

// RIN Experience Stream
interface ExperienceStream {
    duration: number;
    keyframes: Keyframe[];
}

interface ExperienceData {
    defaultKeyframe: Keyframe; // NEW: to be used on load, and when playing an Experience Stream with no keyframes.
}

// RIN Experience
interface Experience {
    data: ExperienceData;  
    experienceStreams: any;
}

interface ITrajectory {
    duration: number;
    renderAt(time: number): void;
    sampleAt?(time:number, kf?: Keyframe): Keyframe;
    targetExperienceStreamId?: string;
}

interface StoryboardHelper {
    buildTransitionTrajectory(traj1: ITrajectory, t1: number, traj2: ITrajectory, t2: number, pause: bool): ITrajectory;
    getCurrentTime(): number;
    startAnimation(): void;
    stopAnimation(): void;
};

interface InterpolationState {
    es: ExperienceStream; // may be null
    time?: number;
    prePreKf?: Keyframe; // may be null
    preKf?: Keyframe; // may be null
    postKf?: Keyframe; // may be null
    postPostKf?: Keyframe; // may be null
};

//
// Signature for an interpolation function that returnes the interpolated value of a keyframe. It uses(if possible/non-null) the passed-in workignKeyframe and returns it, else creates a 
// and returns a new keyframe. 
//
interface KeyframeInterpolator {
    interpolate(time: number, workingKf: Keyframe): Keyframe;
}

interface TrajectoryBuilder {

     keyframeInterpolatorPre(iState: InterpolationState): KeyframeInterpolator;
     sliverInterpolator(sliverId: string, iState: InterpolationState): KeyframeInterpolator;
     keyframeInterpolatorPost(iState: InterpolationState): KeyframeInterpolator;
     renderKeyframe(kf: Keyframe): void;

     storyboardHelper: StoryboardHelper;
     buildTrajectoryFromExperienceStreamId(esId: string): ITrajectory;
     buildTrajectoryFromExperienceStream(es: ExperienceStream): ITrajectory;
};

interface IStoryboard {
    play(traj: ITrajectory, number): void;
    pause(traj: ITrajectory, number): void;
    render(): void; // render at the current time
    renderAt(number): void; // traj.renderAt(10+??)
    stop(): void;
};

// 
// 2D Point structure expected by optional 2D-specific methods. Units depend on context.
//
interface Point2D {

    x: number;
    y: number;
};


//
// Used to specify ranges, such as min/max zoom levels.
//
interface Interval {

    from: number;
    to: number;

};

interface Region {
    center: Point2D;
    span: Point2D;
}