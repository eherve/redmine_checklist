# This file is a part of Redmine Checklists (redmine_checklists) plugin,
# issue checklists management plugin for Redmine
#
# Copyright (C) 2011-2014 Kirill Bezrukov
# http://www.redminecrm.com/
#
# redmine_checklists is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# redmine_checklists is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with redmine_checklists.  If not, see <http://www.gnu.org/licenses/>.

class Checklist < ActiveRecord::Base
  unloadable
  belongs_to :issue
  belongs_to :author, :class_name => "User", :foreign_key => "author_id"
  has_one :comment, :as => :commented, :dependent => :delete

  acts_as_event :datetime => :created_at,
                :url => Proc.new {|o| {:controller => 'issues', :action => 'show', :id => o.issue_id}},
                :type => 'issue-closed',
                :title => Proc.new {|o| o.subject },
                :description => Proc.new {|o| "#{l(:field_issue)}:  #{o.issue.subject}" }

  acts_as_activity_provider :type => "checklists",
                            :permission => :view_checklists,
                            :find_options => {:issue => :project}

  acts_as_searchable :columns => ["#{table_name}.subject"],
                     :include => [:issue => :project],
                     :project_key => "#{Issue.table_name}.project_id",
                     :order_column => "#{table_name}.id"
  acts_as_list

  validates_presence_of :subject
  validates_presence_of :position
  validates_numericality_of :position

  def editable_by?(usr=User.current)
    usr && (usr.allowed_to?(:edit_checklists, project) || (self.author == usr && usr.allowed_to?(:edit_own_checklists, project)))
  end

  def project
    self.issue.project if self.issue
  end

  def info
    "[#{self.is_done ? 'x' : ' ' }] #{self.subject.strip}"
  end

end
