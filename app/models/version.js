import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { computed } from '@ember/object';
import { alias } from '@ember/object/computed';

import { task } from 'ember-concurrency';

export default Model.extend({
  num: attr('string'),
  dl_path: attr('string'),
  readme_path: attr('string'),
  created_at: attr('date'),
  updated_at: attr('date'),
  downloads: attr('number'),
  yanked: attr('boolean'),
  license: attr('string'),

  crate: belongsTo('crate', {
    async: false,
  }),
  authors: hasMany('users', { async: true }),
  dependencies: hasMany('dependency', { async: true }),
  version_downloads: hasMany('version-download', { async: true }),

  crateName: computed('crate', function () {
    return this.belongsTo('crate').id();
  }),
  crate_size: attr('number'),

  normalDependencies: alias('loadDepsTask.last.value.normal'),
  buildDependencies: alias('loadDepsTask.last.value.build'),
  devDependencies: alias('loadDepsTask.last.value.dev'),

  loadDepsTask: task(function* () {
    let dependencies = yield this.get('dependencies');

    let normal = dependencies.filterBy('kind', 'normal').uniqBy('crate_id');
    let build = dependencies.filterBy('kind', 'build').uniqBy('crate_id');
    let dev = dependencies.filterBy('kind', 'dev').uniqBy('crate_id');

    return { normal, build, dev };
  }).keepLatest(),

  loadReadmeTask: task(function* () {
    if (this.readme_path) {
      let response = yield fetch(this.readme_path);
      if (!response.ok) {
        throw new Error(`README request for ${this.crateName} v${this.num} failed`);
      }

      return yield response.text();
    }
  }).keepLatest(),
});
