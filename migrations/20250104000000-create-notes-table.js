export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `);

  const [tables] = await queryInterface.sequelize.query(`
    SELECT tablename FROM pg_tables WHERE tablename = 'notes';
  `);

  if (tables.length > 0) {
    console.log('Table notes already exists, skipping creation');
    return;
  }

  await queryInterface.createTable('notes', {
    id: {
      type: 'UUID',
      defaultValue: queryInterface.sequelize.literal('uuid_generate_v4()'),
      primaryKey: true,
    },
    title: {
      type: 'VARCHAR(255)',
      allowNull: false,
    },
    content: {
      type: 'TEXT',
      allowNull: false,
    },
    color: {
      type: 'VARCHAR(20)',
      allowNull: false,
      defaultValue: '#ffeb3b',
    },
    position_x: {
      type: 'FLOAT',
      allowNull: false,
      defaultValue: 0,
    },
    position_y: {
      type: 'FLOAT',
      allowNull: false,
      defaultValue: 0,
    },
    user_id: {
      type: 'VARCHAR(100)',
      allowNull: false,
    },
    room_id: {
      type: 'VARCHAR(100)',
      allowNull: false,
    },
    created_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      allowNull: false,
      defaultValue: queryInterface.sequelize.literal('NOW()'),
    },
    updated_at: {
      type: 'TIMESTAMP WITH TIME ZONE',
      allowNull: false,
      defaultValue: queryInterface.sequelize.literal('NOW()'),
    },
  });

  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_notes_room_id ON notes(room_id);
  `);

  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
  `);

  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_notes_room_user ON notes(room_id, user_id);
  `);

  await queryInterface.sequelize.query(`
    CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
  `);

  await queryInterface.sequelize.query(`
    CREATE OR REPLACE FUNCTION update_notes_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await queryInterface.sequelize.query(`
    CREATE TRIGGER trigger_update_notes_updated_at
        BEFORE UPDATE ON notes
        FOR EACH ROW
        EXECUTE FUNCTION update_notes_updated_at();
  `);
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    DROP TRIGGER IF EXISTS trigger_update_notes_updated_at ON notes;
  `);

  await queryInterface.sequelize.query(`
    DROP FUNCTION IF EXISTS update_notes_updated_at();
  `);

  await queryInterface.dropTable('notes');
}
