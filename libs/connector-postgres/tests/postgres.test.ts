import {describe, expect, test} from "@jest/globals";
import {AzimuttSchema, DatabaseUrlParsed, parseDatabaseUrl} from "@azimutt/database-types";
import {application, logger} from "./constants";
import {execQuery} from "../src/common";
import {connect} from "../src/connect";
import {formatSchema, getSchema, isPolymorphicColumn, PostgresSchema, RawColumn} from "../src/postgres";

describe('postgres', () => {
    // local url, install db or replace it to test
    const url: DatabaseUrlParsed = parseDatabaseUrl('postgresql://postgres:postgres@localhost:5432/azimutt_dev')
    test.skip('execQuery', async () => {
        const results = await connect(application, url, execQuery('SELECT * FROM users WHERE email = $1 LIMIT 2;', ['admin@azimutt.app']))
        console.log('results', results)
        expect(results.rows.length).toEqual(1)
    })
    test.skip('getSchema', async () => {
        const schema = await connect(application, url, getSchema(undefined, 10, false, logger))
        console.log('schema', schema)
        expect(schema.tables.length).toEqual(13)
    })
    test('formatSchema', () => {
        const rawSchema: PostgresSchema = {tables: [], relations: [], types: []}
        const expectedSchema: AzimuttSchema = {tables: [], relations: [], types: []}
        expect(formatSchema(rawSchema, false)).toEqual(expectedSchema)
    })
    describe('isPolymorphicColumn', () => {
        const id: RawColumn = { table_schema: 'public', table_name: 'events', table_kind: 'r', column_name: 'id', column_type: 'uuid', column_index: 0, column_default: null, column_nullable: false }
        const name = {...id, column_name: 'name'}
        const item_id = {...id, column_name: 'item_id'}
        const item_type = {...id, column_name: 'item_type'}
        const resource_type = {...id, column_name: 'resource_type'}
        const columns = [id, name, item_id, item_type, resource_type]
        test('columns with `type` suffix are polymorphic if they have a matching id column', () => {
            expect(isPolymorphicColumn(item_type, columns)).toBeTruthy()
        })
        test('columns with `type` suffix are not polymorphic without a matching id column', () => {
            expect(isPolymorphicColumn(resource_type, columns)).toBeFalsy()
        })
        test('columns without `type` suffix are not polymorphic', () => {
            expect(isPolymorphicColumn(name, columns)).toBeFalsy()
        })
    })
})
