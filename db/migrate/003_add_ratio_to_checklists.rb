
class AddRatioToChecklists < ActiveRecord::Migration
  def change
    add_column :checklists, :ratio, :integer
  end
end

