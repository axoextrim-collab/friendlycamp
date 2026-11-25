import test from 'node:test';
import assert from 'node:assert/strict';
import {accountDestination,hasManagementAccess,signInDestination} from '../src/routing/accountDestination';

test('authenticated staff open their management workspace and members retain their own profile',()=>{
 const origin='https://friendlycamp.example';
 assert.equal(accountDestination('admin'),'/admin#overview/summary');
 assert.equal(accountDestination('editor'),'/admin#articles/list');
 assert.equal(accountDestination('support'),'/admin#support/open');
 assert.equal(accountDestination('reservations'),'/admin#reservations/departures');
 assert.equal(accountDestination('user'),'/account');assert.equal(hasManagementAccess('user'),false);assert.equal(hasManagementAccess(undefined),false);
 assert.equal(signInDestination('admin',null,origin),'/admin#overview/summary');
 assert.equal(signInDestination('admin','/account',origin),'/admin#overview/summary');
 assert.equal(signInDestination('admin','/account/#security',origin),'/admin#overview/summary');
 assert.equal(signInDestination('support','/profile',origin),'/admin#support/open');
 assert.equal(signInDestination('user','/account#bookings',origin),'/account#bookings');
 assert.equal(signInDestination('user','/profile?section=security',origin),'/account?section=security');
});

test('login preserves intentional bookings and checkout while refusing external, looping and unauthorized management destinations',()=>{
 const origin='https://friendlycamp.example',booking='/tours/real-id/book?guests=2#passengers';
 assert.equal(signInDestination('admin',booking,origin),booking);
 assert.equal(signInDestination('user','/shop/checkout',origin),'/shop/checkout');
 assert.equal(signInDestination('admin','/admin#design/colors',origin),'/admin#design/colors');
 assert.equal(signInDestination('user','/admin',origin),'/account');
 assert.equal(signInDestination('user','/shop/manage',origin),'/account');
 for(const target of ['https://external.example/account','//external.example/','javascript:alert(1)','/login','/login/','/register?returnTo=/login','/api/manage/session','/unknown-account-route']){
  assert.equal(signInDestination('admin',target,origin),'/admin#overview/summary',target);
  assert.equal(signInDestination('user',target,origin),'/account',target);
 }
});
