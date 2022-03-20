import { quotas } from "@budibase/pro"
import { save } from "../../api/controllers/row"
import { cleanUpRow, getError } from "../automationUtils"
import { buildCtx } from "./utils"

export const definition = {
  name: "Create Row",
  tagline: "Create a {{inputs.enriched.table.name}} row",
  icon: "TableRowAddBottom",
  description: "Add a row to your database",
  type: "ACTION",
  internal: true,
  stepId: "CREATE_ROW",
  inputs: {},
  schema: {
    inputs: {
      properties: {
        row: {
          type: "object",
          properties: {
            tableId: {
              type: "string",
              customType: "table",
            },
          },
          customType: "row",
          title: "Table",
          required: ["tableId"],
        },
      },
      required: ["row"],
    },
    outputs: {
      properties: {
        row: {
          type: "object",
          customType: "row",
          description: "The new row",
        },
        response: {
          type: "object",
          description: "The response from the table",
        },
        success: {
          type: "boolean",
          description: "Whether the row creation was successful",
        },
        id: {
          type: "string",
          description: "The identifier of the new row",
        },
        revision: {
          type: "string",
          description: "The revision of the new row",
        },
      },
      required: ["success", "id", "revision"],
    },
  },
}

export async function run({ inputs, appId, emitter }: any) {
  if (inputs.row == null || inputs.row.tableId == null) {
    return {
      success: false,
      response: {
        message: "Invalid inputs",
      },
    }
  }
  // have to clean up the row, remove the table from it
  const ctx: any = buildCtx(appId, emitter, {
    body: inputs.row,
    params: {
      tableId: inputs.row.tableId,
    },
  })

  try {
    inputs.row = await cleanUpRow(inputs.row.tableId, inputs.row)
    await quotas.addRow(() => save(ctx))
    return {
      row: inputs.row,
      response: ctx.body,
      id: ctx.body._id,
      revision: ctx.body._rev,
      success: ctx.status === 200,
    }
  } catch (err) {
    return {
      success: false,
      response: getError(err),
    }
  }
}
