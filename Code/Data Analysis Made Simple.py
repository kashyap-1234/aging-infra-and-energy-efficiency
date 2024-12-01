#!/usr/bin/env python
# coding: utf-8

# In[1]:


import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import folium
from branca.element import Template, MacroElement
from folium.plugins import MarkerCluster
import geopandas as gpd

sns.set(style="whitegrid")


# In[2]:


df = pd.read_csv("Chicago Energy Benchmarking 20241014.csv")
df.head()


# In[3]:


df.shape


# In[4]:


df.info()


# In[5]:


plt.figure(figsize=(15, 6), dpi=600)
sns.heatmap(df.isnull(), cbar=False, cmap='viridis')
plt.title('Missing Data Distribution Before Preprocessing')
plt.savefig("Unprocessed Data.png")
plt.show()


# In[6]:


threshold = 0.5  # Columns with more than 50% missing values will be flagged for dropping

# Calculate the percentage of missing values for each column
missing_percentage = df.isnull().mean()
columns_to_drop = missing_percentage[missing_percentage > threshold].index.tolist()

# Display the columns that are going to be dropped
print("Columns to be dropped:", columns_to_drop)

# Drop columns and visualize the new dataset state
df.drop(columns=columns_to_drop, inplace=True)

plt.figure(figsize=(15, 6), dpi=600)
sns.heatmap(df.isnull(), cbar=False, cmap='viridis')
plt.title('Missing Data Distribution After Dropping Columns')
plt.savefig("Columns processed Data.png")
plt.show()


# In[7]:


df.dropna(inplace=True)
# Data shape after dropping rows with null values
print("Data shape after dropping nulls:", df.shape)


# In[8]:


plt.figure(figsize=(15, 6), dpi=600)
sns.heatmap(df.isnull(), cbar=False, cmap='viridis')
plt.title('Missing Data Distribution Before Preprocessing')
plt.savefig("Full processed Data.png")
plt.show()


# In[9]:


df['Building Age'] = df['Data Year'] - df['Year Built']


# In[10]:


df['ZIP Code'] = df['ZIP Code'].astype(str)


# In[11]:


df.shape


# In[12]:


df.info()


# In[ ]:





# In[13]:


# 1. Distribution of Building Age
plt.figure(figsize=(10, 6), dpi=600)
sns.histplot(df['Building Age'], bins=30, color='skyblue', kde=True)
plt.title('Distribution of Building Age')
plt.xlabel('Building Age')
plt.ylabel('Frequency')
plt.savefig("Distribution of Building Age.png")
plt.show()

# 2. Distribution of ENERGY STAR Scores
plt.figure(figsize=(10, 6), dpi=600)
sns.histplot(df['ENERGY STAR Score'], bins=30, color='green', kde=True)
plt.title('Distribution of ENERGY STAR Scores')
plt.xlabel('ENERGY STAR Score')
plt.ylabel('Frequency')
plt.savefig("Distribution of ENERGY STAR Scores.png")
plt.show()

# 3. Relationship between Building Age and Site EUI
plt.figure(figsize=(10, 6), dpi=600)
sns.scatterplot(x='Building Age', y='Site EUI (kBtu/sq ft)', data=df, alpha=0.6)
plt.title('Building Age vs. Site EUI')
plt.xlabel('Building Age')
plt.ylabel('Site EUI (kBtu/sq ft)')
plt.savefig("Building Age vs. Site EUI.png")
plt.show()

# 4. Energy Use Intensity (EUI) Distribution
plt.figure(figsize=(10, 6), dpi=600)
sns.histplot(df['Site EUI (kBtu/sq ft)'], bins=30, color='purple', kde=True)
plt.title('Distribution of Site EUI')
plt.xlabel('Site EUI (kBtu/sq ft)')
plt.ylabel('Frequency')
plt.savefig("Distribution of Site EUI.png")
plt.show()

# 5. Geospatial Distribution of Energy Efficiency (optional, if latitude and longitude data are useful)
plt.figure(figsize=(10, 6), dpi=600)
plt.scatter(df['Longitude'], df['Latitude'], c=df['ENERGY STAR Score'], cmap='coolwarm', alpha=0.5)
plt.colorbar(label='ENERGY STAR Score')
plt.title('Geospatial Distribution of Energy Efficiency')
plt.xlabel('Longitude')
plt.ylabel('Latitude')
plt.savefig("Geospatial Distribution of Energy Efficiency.png")
plt.show()


# In[14]:


# Create the map object
map = folium.Map(location=[41.8781, -87.6298], zoom_start=11, tiles='CartoDB positron')

# Add a marker cluster to the map
marker_cluster = MarkerCluster().add_to(map)

# Iterate through the DataFrame
for idx, row in df.iterrows():
    # Define the color based on the ENERGY STAR Score
    color = 'green' if row['ENERGY STAR Score'] > 75 else 'red'
    # Add a marker for each property
    folium.Marker(
        location=[row['Latitude'], row['Longitude']],
        popup=f'ENERGY STAR Score: {row["ENERGY STAR Score"]}',
        icon=folium.Icon(color=color)
    ).add_to(marker_cluster)

# Define the HTML template for the legend
template = """
{% macro html(this, kwargs) %}
<div style="
    position: fixed;
    bottom: 50px;
    left: 50px;
    width: 150px;
    height: 75px;
    border:2px solid grey;
    z-index:9999;
    font-size:14px;
    background: white;
    box-shadow: 3px 3px 3px grey;
    opacity: 0.9;
    ">
    <div style="background-color: green; padding: 10px; text-align: center; color: white;">Energy Star Score >75</div>
    <div style="background-color: red; padding: 10px; text-align: center; color: white;">Energy Star Score ≤75</div>
</div>
{% endmacro %}
"""

# Create a Template object
macro = MacroElement()
macro._template = Template(template)

# Add the legend to the map
map.get_root().add_child(macro)

# Display the map in the notebook (if using Jupyter) or save to HTML


# In[15]:


map.save('Energy_Star_Scores_Map_with_legend.html')


# In[16]:


# Categorize building ages
def categorize_age(age):
    if age >= 100:
        return 'Historic (100+ years)'
    elif age >= 50:
        return 'Aged (50-99 years)'
    else:
        return 'Modern (less than 50 years)'

df['Age Category'] = df['Building Age'].apply(categorize_age)


# In[17]:


# Define the color for each category
def color_producer(age_category):
    if age_category == 'Historic (100+ years)':
        return 'darkred'
    elif age_category == 'Aged (50-99 years)':
        return 'orange'
    else:
        return 'green'


# In[18]:


# Create the Folium map
map = folium.Map(location=[41.8781, -87.6298], zoom_start=11, tiles='CartoDB positron')

# Add markers
for _, row in df.iterrows():
    folium.CircleMarker(
        location=[row['Latitude'], row['Longitude']],
        radius=5,
        color=color_producer(row['Age Category']),
        fill=True,
        fill_color=color_producer(row['Age Category']),
        fill_opacity=0.7,
        popup=f"Property: {row['Property Name']}, Age: {row['Building Age']}"
    ).add_to(map)

# Define the HTML template for the legend
template = """
{% macro html(this, kwargs) %}
<div style="
    position: fixed;
    bottom: 50px;
    left: 50px;
    width: 200px;
    height: 120px;
    border:2px solid grey;
    z-index:9999;
    font-size:14px;
    background: white;
    box-shadow: 3px 3px 3px grey;
    opacity: 0.9;
    ">
    <div style="background-color: darkred; padding: 10px; text-align: center; color: white;">Historic (100+ years)</div>
    <div style="background-color: orange; padding: 10px; text-align: center; color: white;">Aged (50-99 years)</div>
    <div style="background-color: green; padding: 10px; text-align: center; color: white;">Modern (less than 50 years)</div>
</div>
{% endmacro %}
"""

# Create a Template object
macro = MacroElement()
macro._template = Template(template)

# Add the legend to the map
map.get_root().add_child(macro)

map


# In[19]:


# Save the map to an HTML file
map.save('Building_Ages_Map_with_Legend.html')


# In[25]:


df[df['Data Year'] == 2020]


# In[27]:


df[df['Data Year'] == 2018]


# In[29]:


df[df['Data Year'] == 2021]


# In[49]:


sns.set(style="whitegrid")

# Plotting the distribution of ENERGY STAR Scores by Year
plt.figure(figsize=(10, 6), dpi=600)
sns.boxplot(x='Data Year', y='ENERGY STAR Score', data=df)
plt.title('Distribution of ENERGY STAR Scores by Year')
plt.xlabel('Year')
plt.ylabel('ENERGY STAR Score')
plt.savefig("Distribution of ENERGY STAR Scores by Year.png")
plt.show()


# In[50]:


# Grouping data by Year and calculating average Site EUI
yearly_eui = df.groupby('Data Year')['Site EUI (kBtu/sq ft)'].mean().reset_index()

# Plotting
plt.figure(figsize=(10, 6), dpi=600)
sns.lineplot(x='Data Year', y='Site EUI (kBtu/sq ft)', data=yearly_eui, marker='o')
plt.title('Average Site EUI by Year')
plt.xlabel('Year')
plt.ylabel('Average Site EUI (kBtu/sq ft)')
plt.grid(True)
plt.xticks(yearly_eui['Data Year'])  # Ensure all years are shown
plt.savefig("Average Site EUI by Year.png")
plt.show()


# In[33]:


# Selecting a few relevant columns to see correlations
correlation_metrics = df[['ENERGY STAR Score', 'Site EUI (kBtu/sq ft)', 'Natural Gas Use (kBtu)', 'Total GHG Emissions (Metric Tons CO2e)', 'Building Age']]
corr_matrix = correlation_metrics.corr()

# Plotting the correlation heatmap
plt.figure(figsize=(10, 8), dpi=600)
sns.heatmap(corr_matrix, annot=True, fmt=".2f", cmap='coolwarm')
plt.title('Correlation Matrix of Selected Metrics')
plt.show()


# In[34]:


plt.figure(figsize=(10, 6), dpi=600)
sns.scatterplot(x='Building Age', y='ENERGY STAR Score', data=df, alpha=0.6)
plt.title('Building Age vs. ENERGY STAR Score')
plt.xlabel('Building Age')
plt.ylabel('ENERGY STAR Score')
plt.show()


# In[37]:


df['Total Energy Consumption (kBtu)'] = df['Electricity Use (kBtu)'] + df['Natural Gas Use (kBtu)']

# Group data by 'Building Age'
age_groups = df.groupby('Building Age').agg({
    'Site EUI (kBtu/sq ft)': 'mean',
    'Total Energy Consumption (kBtu)': 'sum'
}).reset_index()


# In[38]:


sns.set(style="whitegrid")

# Plotting Building Age vs. Average Site EUI
plt.figure(figsize=(12, 6), dpi=600)
sns.scatterplot(x='Building Age', y='Site EUI (kBtu/sq ft)', data=age_groups, color='blue', s=100, alpha=0.6)
plt.title('Building Age vs. Average Site EUI')
plt.xlabel('Building Age (years)')
plt.ylabel('Average Site EUI (kBtu/sq ft)')
plt.grid(True)
plt.show()


# In[39]:


# Plotting Building Age vs. Total Energy Consumption
plt.figure(figsize=(12, 6), dpi=600)
sns.scatterplot(x='Building Age', y='Total Energy Consumption (kBtu)', data=age_groups, color='green', s=100, alpha=0.6)
plt.title('Building Age vs. Total Energy Consumption')
plt.xlabel('Building Age (years)')
plt.ylabel('Total Energy Consumption (kBtu)')
plt.grid(True)
plt.show()


# In[40]:


df["Building Age"]


# In[41]:


df.columns


# In[44]:


df['Data Year'].unique()


# In[ ]:




