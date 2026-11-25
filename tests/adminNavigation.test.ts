import test from 'node:test';
import assert from 'node:assert/strict';
import {ADMIN_GROUPS,ADMIN_PAGES,adminRoute,adminPermitted,type AdminTab} from '../src/admin/adminNavigation';

test('every admin menu has distinct deep-linked subpages and legacy edit links still resolve',()=>{
 const tabs=ADMIN_GROUPS.flatMap(group=>group.items);assert.equal(new Set(tabs).size,tabs.length);
 const targets=new Set<string>();for(const tab of tabs){assert.ok(ADMIN_PAGES[tab].length,tab);for(const page of ADMIN_PAGES[tab]){const target=tab+'/'+page.id;assert.ok(!targets.has(target));targets.add(target);assert.deepEqual(adminRoute('#'+target),{tab,view:page.id,intent:''});assert.ok(page.title&&page.description);}}
 assert.deepEqual(adminRoute('#tours?edit=abc'),{tab:'tours',view:'edit',intent:'edit=abc'});assert.equal(adminRoute('#articles?new=1').view,'new');assert.equal(adminRoute('#settings/invalid').view,'general');
 assert.equal(adminPermitted('editor','settings'),false);assert.equal(adminPermitted('support','finance'),false);assert.equal(adminPermitted('reservations','reservations'),true);assert.equal(adminPermitted('admin','settings'),true);
});
