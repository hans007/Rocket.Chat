import type { VideoConference } from '@rocket.chat/apps-engine/definition/videoConferences';
import type { IVideoConference } from '@rocket.chat/core-typings';

import { VideoConf } from '../../../../server/sdk';

export class AppVideoConferencesConverter {
	async convertById(callId: string): Promise<VideoConference | undefined> {
		const call = await VideoConf.get(callId);

		return this.convertVideoConference(call);
	}

	convertVideoConference(call: IVideoConference | null): VideoConference | undefined {
		if (!call) {
			return;
		}

		return {
			...call,
		} as VideoConference;
	}

	convertAppVideoConference(call: VideoConference | null): IVideoConference | undefined {
		if (!call) {
			return;
		}

		return {
			...call,
		} as IVideoConference;
	}
}