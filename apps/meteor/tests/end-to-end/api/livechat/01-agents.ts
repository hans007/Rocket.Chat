/* eslint-env mocha */

import type { ILivechatAgent, ILivechatDepartment } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { Response } from 'supertest';

import { getCredentials, api, request, credentials } from '../../../data/api-data';
import { createAgent, createManager } from '../../../data/livechat/rooms';
import { updatePermission, updateSetting } from '../../../data/permissions.helper';
import { createUser } from '../../../data/users.helper';

describe('LIVECHAT - Agents', function () {
	this.retries(0);
	let agent: ILivechatAgent;
	let manager: ILivechatAgent;

	before((done) => getCredentials(done));

	before((done) => {
		updateSetting('Livechat_enabled', true)
			.then(createAgent)
			.then((createdAgent) => {
				agent = createdAgent;
			})
			.then(createManager)
			.then((createdManager) => {
				manager = createdManager;
				done();
			});
	});

	// TODO: missing test cases for POST method
	describe('GET livechat/users/:type', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('edit-omnichannel-contact', [])
				.then(() => updatePermission('transfer-livechat-guest', []))
				.then(() => updatePermission('manage-livechat-agents', []))
				.then(() => {
					request
						.get(api('livechat/users/agent'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.error).to.be.equal('error-not-authorized');
						})
						.end(done);
				});
		});
		it('should throw an error when the type is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => updatePermission('manage-livechat-agents', ['admin']))
				.then(() => {
					request
						.get(api('livechat/users/invalid-type'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', false);
							expect(res.body.error).to.be.equal('Invalid type');
						})
						.end(done);
				});
		});
		it('should return an array of agents', (done) => {
			updatePermission('edit-omnichannel-contact', ['admin'])
				.then(() => updatePermission('transfer-livechat-guest', ['admin']))
				.then(() => {
					request
						.get(api('livechat/users/agent'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.users).to.be.an('array');
							expect(res.body).to.have.property('offset');
							expect(res.body).to.have.property('total');
							expect(res.body).to.have.property('count');
							const agentRecentlyCreated = (res.body.users as ILivechatAgent[]).find((user) => agent._id === user._id);
							expect(agentRecentlyCreated?._id).to.be.equal(agent._id);
						})
						.end(done);
				});
		});
		it('should return an array of managers', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => updatePermission('manage-livechat-agents', ['admin']))
				.then(() => {
					request
						.get(api('livechat/users/manager'))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body.users).to.be.an('array');
							expect(res.body).to.have.property('offset');
							expect(res.body).to.have.property('total');
							expect(res.body).to.have.property('count');
							const managerRecentlyCreated = (res.body.users as ILivechatAgent[]).find((user) => manager._id === user._id);
							expect(managerRecentlyCreated?._id).to.be.equal(manager._id);
						})
						.end(done);
				});
		});
	});

	describe('POST livechat/users/:type', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', [])
				.then(() => {
					request
						.post(api('livechat/users/agent'))
						.set(credentials)
						.send({
							username: 'test-agent',
						})
						.expect('Content-Type', 'application/json')
						.expect(403);
				})
				.then(() => done());
		});

		it('should return an error when type is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request
						.post(api('livechat/users/invalid-type'))
						.set(credentials)
						.send({
							username: 'test-agent',
						})
						.expect('Content-Type', 'application/json')
						.expect(400);
				})
				.then(() => done());
		});

		it('should return an error when username is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request
						.post(api('livechat/users/agent'))
						.set(credentials)
						.send({
							username: 'mr-not-valid',
						})
						.expect('Content-Type', 'application/json')
						.expect(400);
				})
				.then(() => done());
		});

		it('should return a valid user when all goes fine', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => createUser())
				.then((user) => {
					request
						.post(api('livechat/users/agent'))
						.set(credentials)
						.send({
							username: user.username,
						})
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('user');
							expect(res.body.user).to.have.property('_id');
							expect(res.body.user).to.have.property('username');
						});
				})
				.then(() => done());
		});
	});

	describe('GET livechat/users/:type/:_id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', [])
				.then(() => {
					request
						.get(api(`livechat/users/agent/id${agent._id}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(403);
				})
				.then(() => done());
		}).timeout(5000);

		it('should return an error when type is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request
						.get(api(`livechat/users/invalid-type/invalid-id${agent._id}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(400);
				})
				.then(() => done());
		}).timeout(5000);

		it('should return an error when _id is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request.get(api('livechat/users/agent/invalid-id')).set(credentials).expect('Content-Type', 'application/json').expect(400);
				})
				.then(() => done());
		}).timeout(5000);

		it('should return a valid user when all goes fine', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => createAgent())
				.then((agent) => {
					request
						.get(api(`livechat/users/agent/${agent._id}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('user');
							expect(res.body.user).to.have.property('_id');
							expect(res.body.user).to.have.property('username');
							expect(res.body.user).to.not.have.property('roles');
						});
				})
				.then(() => done());
		});

		it('should return { user: null } when user is not an agent', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => createUser())
				.then((user) => {
					request
						.get(api(`livechat/users/agent/${user._id}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200)
						.expect((res: Response) => {
							expect(res.body).to.have.property('success', true);
							expect(res.body).to.have.property('user');
							expect(res.body.user).to.be.null;
						});
				})
				.then(() => done());
		});
	});

	describe('DELETE livechat/users/:type/:_id', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-livechat-manager', [])
				.then(() => {
					request.delete(api(`livechat/users/agent/id`)).set(credentials).expect('Content-Type', 'application/json').expect(403);
				})
				.then(() => done());
		}).timeout(5000);

		it('should return an error when type is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request.delete(api(`livechat/users/invalid-type/id`)).set(credentials).expect('Content-Type', 'application/json').expect(400);
				})
				.then(() => done());
		}).timeout(5000);

		it('should return an error when _id is invalid', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => {
					request.delete(api('livechat/users/agent/invalid-id')).set(credentials).expect('Content-Type', 'application/json').expect(400);
				})
				.then(() => done());
		}).timeout(5000);

		it('should return a valid user when all goes fine', (done) => {
			updatePermission('view-livechat-manager', ['admin'])
				.then(() => createAgent())
				.then((agent) => {
					request
						.delete(api(`livechat/users/agent/${agent._id}`))
						.set(credentials)
						.expect('Content-Type', 'application/json')
						.expect(200);
				})
				.then(() => done());
		});
	});

	describe('livechat/agents/:agentId/departments', () => {
		it('should return an "unauthorized error" when the user does not have the necessary permission', (done) => {
			updatePermission('view-l-room', []).then(() => {
				request
					.get(api(`livechat/agents/${agent._id}/departments`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(400)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', false);
						expect(res.body.error).to.be.equal('error-not-authorized');
					})
					.end(done);
			});
		});
		it('should return an empty array of departments when the agentId is invalid', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				request
					.get(api('livechat/agents/invalid-id/departments'))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('departments').and.to.be.an('array');
					})
					.end(done);
			});
		});
		it('should return an array of departments when the agentId is valid', (done) => {
			updatePermission('view-l-room', ['admin']).then(() => {
				request
					.get(api(`livechat/agents/${agent._id}/departments`))
					.set(credentials)
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res: Response) => {
						expect(res.body).to.have.property('success', true);
						expect(res.body).to.have.property('departments').and.to.be.an('array');
						(res.body.departments as ILivechatDepartment[]).forEach((department) => {
							expect(department.agentId).to.be.equal(agent._id);
						});
					})
					.end(done);
			});
		});
	});
});

// TODO:
// Missing tests for following endpoint:
// livechat/users/:type/:_id
// livechat/agent.info/:rid/:token
// livechat/agent.next/:token
