// @vitest-environment jsdom
/**
 * `FileSystem` — the file browser of an application.
 *
 * 529 lines at 0%: it lists a directory, builds the breadcrumb, keeps the selected rows and starts
 * downloads. The tests give a directory to the simulated server and check what the screen requests
 * and remembers.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

const post = vi.fn()
const get = vi.fn()
vi.mock('axios', () => ({
  default: { post: (...args) => post(...args), get: (...args) => get(...args) },
}))

import { flushPromises } from '@vue/test-utils'

import { mountView, resetStore } from '../helpers/mount-view'

import FileSystem from '@/components/FileSystem.vue'

const mounted = []
afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
})

const FILES = [
  { name: 'b.txt', extension: 'txt', type: 'file', size: 12, path: '/b.txt' },
  { name: 'a.csv', extension: 'csv', type: 'file', size: 34, path: '/a.csv' },
  { name: 'dossier', extension: '', type: 'dir', path: '/dossier' },
]

const CONFIG = { rec_id: 'app-fs', config: { index: 'files', headercolumns: [] } }

async function mountFs({ files = FILES, path = '/' } = {}) {
  resetStore({
    creds: { token: 'tok', hasPrivilege: () => true, user: { id: 'u-1', login: 'alice' } },
    currentSubCategory: { apps: [{}, {}], loc_title: 'Files' },
  })

  // a copy: the component sorts the array it receives, by extension order
  post.mockImplementation(() =>
    Promise.resolve({ data: { error: '', data: files.map((file) => ({ ...file })) } })
  )
  // downloads go through `axios.get` as a blob
  get.mockImplementation(() => Promise.resolve({ data: new Blob(['x']) }))

  const result = await mountView(FileSystem, {
    at: `/?path=${encodeURIComponent(path)}`,
    props: { config: CONFIG },
  })
  mounted.push(result.wrapper)
  await flushPromises()
  return result
}

describe('FileSystem — lecture du repertoire', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('demande le repertoire courant au serveur, avec le jeton', async () => {
    await mountFs()

    const [url, body] = post.mock.calls[0]
    expect(url).toContain('token=tok')
    expect(body).toEqual({ rec_id: 'app-fs', path: '/' })
  })

  it('trie par extension et ne garde que les premieres lignes', async () => {
    const { wrapper } = await mountFs()

    expect(wrapper.vm.allData.map((file) => file.extension)).toEqual(['', 'csv', 'txt'])
    expect(wrapper.vm.numberOfItems).toBe(3)
    expect(wrapper.vm.tableData.length).toBeLessThanOrEqual(wrapper.vm.scrollSize)
  })

  it('lit le chemin dans l\'URL de la route', async () => {
    const { wrapper } = await mountFs({ path: '/dossier' })

    expect(wrapper.vm.curPath).toBe('/dossier')
    expect(post.mock.calls[0][1].path).toBe('/dossier')
  })

  it('garde la liste vide quand le repertoire n\'a rien', async () => {
    const { wrapper } = await mountFs({ files: [] })

    expect(wrapper.vm.allData).toEqual([])
    expect(wrapper.vm.numberOfItems).toBe(0)
  })
})

describe('FileSystem — selection', () => {
  beforeEach(() => {
    post.mockReset()
  })

  it('retient les lignes selectionnees', async () => {
    const { wrapper } = await mountFs()

    wrapper.vm.handleSelectionChange([FILES[0], FILES[1]])

    expect(wrapper.vm.multipleSelection).toEqual([FILES[0], FILES[1]])
  })

  it('coche les lignes demandees dans la table', async () => {
    const { wrapper } = await mountFs()
    const toggle = vi.spyOn(wrapper.vm.$refs.filesTable, 'toggleRowSelection')

    wrapper.vm.toggleSelection([FILES[0]])

    expect(toggle).toHaveBeenCalledWith(FILES[0])
  })
})

describe('FileSystem — dossiers et fichiers', () => {
  beforeEach(() => {
    post.mockReset()
    get.mockReset()
  })

  it('telecharge les fichiers selectionnes', async () => {
    const { wrapper } = await mountFs()
    wrapper.vm.multipleSelection = [FILES[0], FILES[1]]

    wrapper.vm.downloadBtnClick()
    await flushPromises()

    const [url] = get.mock.calls[get.mock.calls.length - 1]
    expect(url).toContain('files?token=tok')
    expect(url).toContain('rec_id=app-fs')
    expect(url).toContain('files=b.txt,a.csv')
  })

  it('retient le fichier ouvert', async () => {
    const { wrapper } = await mountFs()

    wrapper.vm.rowDoubleClick(FILES[0])
    await flushPromises()

    expect(wrapper.vm.selectedFileName).toBe('b.txt')
  })

  it('entre dans un dossier et met le chemin dans l\'URL', async () => {
    const { wrapper, router } = await mountFs()

    wrapper.vm.rowDoubleClick(FILES[2])
    await flushPromises()

    expect(wrapper.vm.curPath).toBe('//dossier')
    expect(router.currentRoute.value.query.path).toBe('//dossier')
  })
})
